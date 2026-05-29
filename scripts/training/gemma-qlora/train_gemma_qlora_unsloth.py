# /// script
# dependencies = [
#   "unsloth",
#   "trl>=0.26.0",
#   "datasets>=3.0.0",
#   "transformers>=4.56.0",
#   "accelerate",
#   "bitsandbytes",
#   "peft",
# ]
# ///

"""Train a Gemma-family LoRA adapter from an AIRI LoRA export package.

This script is intentionally outside the Electron app. Run it in a separate
Python/uv environment after AIRI's validateLoraTrainingPackage dry-run passes.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

ALLOWED_MESSAGE_ROLES = {"system", "user", "assistant"}
CHAT_ARCHIVE_PATTERN = re.compile(r"\[(微信|WeChat|飞书|Feishu|QQ)\]", re.IGNORECASE)
CREDENTIAL_PATTERN = re.compile(r"\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\s*[:=]\s*\S{8,}|\bsk-[\w-]{12,}\b", re.IGNORECASE)
INVISIBLE_UNICODE_PATTERN = re.compile(r"[\u200B-\u200F\u202A-\u202E\u2060-\u206F]")
LOCAL_PATH_PATTERN = re.compile(r"[A-Za-z]:[\\/]|/(?:Users|home|mnt|private|var|tmp)/")
MIN_ASSISTANT_CONTENT_LENGTH = 40
EXPECTED_DRY_RUN_CHECKS = ["privacy_flags", "dataset_counts", "chat_record_safety", "training_runbook_exists", "post_training_checklist_exists"]
EXPECTED_RECORD_SCHEMA_VERSION = 1


def main(args: argparse.Namespace) -> None:
    config_path = args.config.resolve()
    export_dir = config_path.parent
    config = load_json(config_path)
    package = validate_training_package(config, export_dir)

    if args.dry_run:
        print(json.dumps({
            "schemaVersion": 1,
            "ok": True,
            "checks": EXPECTED_DRY_RUN_CHECKS,
            "counts": package["counts"],
            "artifacts": package["artifacts"],
        }, ensure_ascii=False))
        return

    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer
    from unsloth import FastLanguageModel

    train_records = package["trainRecords"]
    eval_records = package["evalRecords"]
    train_dataset = Dataset.from_list(train_records)
    eval_dataset = Dataset.from_list(eval_records) if eval_records else None

    qlora_defaults = config["qloraDefaults"]
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.base_model,
        max_seq_length=qlora_defaults["sequenceLength"],
        dtype=None,
        load_in_4bit=qlora_defaults["loadIn4bit"],
    )
    model = FastLanguageModel.get_peft_model(
        model,
        r=qlora_defaults["loraRank"],
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj",
        ],
        lora_alpha=qlora_defaults["loraAlpha"],
        lora_dropout=qlora_defaults["loraDropout"],
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=args.seed,
    )

    training_args = SFTConfig(
        output_dir=str(args.output_dir),
        max_length=qlora_defaults["sequenceLength"],
        learning_rate=qlora_defaults["learningRate"],
        num_train_epochs=qlora_defaults["epochs"],
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        logging_steps=5,
        save_strategy="epoch",
        eval_strategy="steps" if eval_dataset is not None else "no",
        eval_steps=args.eval_steps if eval_dataset is not None else None,
        assistant_only_loss=True,
        push_to_hub=args.push_to_hub,
        hub_model_id=args.hub_model_id,
        report_to="none",
    )

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        args=training_args,
    )

    trainer.train()
    trainer.save_model(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))

    if args.push_to_hub:
        trainer.push_to_hub()


def validate_training_package(config: dict[str, Any], export_dir: Path) -> dict[str, Any]:
    validate_privacy_flags(config)
    validate_dry_run_contract(config)
    artifact_paths = validate_artifact_config(config, export_dir)
    validate_training_runbook(artifact_paths["trainingRunbookPath"])
    validate_post_training_checklist(artifact_paths["postTrainingChecklistPath"])
    dataset_config = config["dataset"]
    validate_record_schema_config(dataset_config)
    train_path = resolve_export_path(export_dir, dataset_config["trainPath"], "dataset path")
    eval_path = resolve_export_path(export_dir, dataset_config["evalPath"], "dataset path")
    candidates_path = resolve_export_path(export_dir, dataset_config["candidatesPath"], "dataset path")

    record_schema_version = dataset_config["recordSchemaVersion"]
    candidate_records = load_jsonl_records(candidates_path, record_schema_version)
    train_records = load_jsonl_records(train_path, record_schema_version)
    eval_records = load_jsonl_records(eval_path, record_schema_version)

    if len(candidate_records) != dataset_config["candidateCount"]:
        raise ValueError(f"Candidate row count mismatch: config={dataset_config['candidateCount']} actual={len(candidate_records)}")

    if len(train_records) != dataset_config["trainCount"]:
        raise ValueError(f"Train row count mismatch: config={dataset_config['trainCount']} actual={len(train_records)}")

    if len(eval_records) != dataset_config["evalCount"]:
        raise ValueError(f"Eval row count mismatch: config={dataset_config['evalCount']} actual={len(eval_records)}")

    return {
        "counts": {
            "candidates": len(candidate_records),
            "train": len(train_records),
            "eval": len(eval_records),
        },
        "artifacts": {
            "trainingRunbookPath": config["artifacts"]["trainingRunbookPath"],
            "postTrainingChecklistPath": config["artifacts"]["postTrainingChecklistPath"],
        },
        "trainRecords": train_records,
        "evalRecords": eval_records,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a Gemma QLoRA adapter from AIRI LoRA exports.")
    parser.add_argument("--config", type=Path, default=Path("lora-training-config.json"))
    parser.add_argument("--base-model", default="google/gemma-3-4b-it")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/airi-gemma-lora"))
    parser.add_argument("--per-device-train-batch-size", type=int, default=1)
    parser.add_argument("--gradient-accumulation-steps", type=int, default=8)
    parser.add_argument("--eval-steps", type=int, default=25)
    parser.add_argument("--seed", type=int, default=3407)
    parser.add_argument("--push-to-hub", action="store_true")
    parser.add_argument("--hub-model-id")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--error-format", choices=["text", "json"], default="text")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        parsed = json.load(file)

    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object in {path}")

    return parsed


def resolve_export_path(export_dir: Path, relative_path: str, path_label: str) -> Path:
    candidate = Path(relative_path)

    if candidate.is_absolute():
        raise ValueError(f"{path_label} must be relative: {relative_path}")

    resolved = (export_dir / candidate).resolve()
    if export_dir not in resolved.parents and resolved != export_dir:
        raise ValueError(f"{path_label} escapes export directory: {relative_path}")

    return resolved


def validate_privacy_flags(config: dict[str, Any]) -> None:
    privacy = config.get("privacy", {})
    expected = {
        "containsRawChatImports": False,
        "containsBlockedMemoryContent": False,
        "containsSourceMetadataPaths": False,
        "requiresHumanApprovalBeforeTraining": True,
    }

    for key, expected_value in expected.items():
        if privacy.get(key) is not expected_value:
            raise ValueError(f"Unsafe privacy flag {key}: expected {expected_value!r}")


def validate_dry_run_contract(config: dict[str, Any]) -> None:
    contract = config.get("dryRunContract", {})
    if not isinstance(contract, dict):
        raise ValueError("Invalid dry-run contract: expected object")

    success_checks = contract.get("successChecks")
    if (
        contract.get("successSchemaVersion") != 1
        or not isinstance(success_checks, list)
        or success_checks != EXPECTED_DRY_RUN_CHECKS
        or contract.get("errorFormat") != "json"
        or contract.get("validationErrorType") != "validation_error"
        or contract.get("validationErrorExitCode") != 2
    ):
        raise ValueError("Invalid dry-run contract: does not match script contract")


def validate_record_schema_config(dataset_config: dict[str, Any]) -> None:
    if dataset_config.get("recordSchemaVersion") != EXPECTED_RECORD_SCHEMA_VERSION:
        raise ValueError("Invalid record schema: dataset.recordSchemaVersion must be 1")


def validate_artifact_config(config: dict[str, Any], export_dir: Path) -> dict[str, Path]:
    artifacts = config.get("artifacts")
    if not isinstance(artifacts, dict):
        raise ValueError("Invalid artifact config: expected artifacts object")

    resolved_paths: dict[str, Path] = {}
    for key in ["trainingRunbookPath", "postTrainingChecklistPath"]:
        relative_path = artifacts.get(key)
        if not isinstance(relative_path, str) or not relative_path.strip():
            raise ValueError(f"Invalid artifact path {key}: expected non-empty string")
        resolved_paths[key] = resolve_export_path(export_dir, relative_path, "artifact path")

    return resolved_paths


def validate_post_training_checklist(checklist_path: Path) -> None:

    if not checklist_path.is_file():
        raise ValueError(f"Missing post-training checklist: {checklist_path.name}")


def validate_training_runbook(runbook_path: Path) -> None:
    if not runbook_path.is_file():
        raise ValueError(f"Missing training runbook: {runbook_path.name}")


def load_jsonl_records(path: Path, expected_record_schema_version: int) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            stripped = line.strip()
            if not stripped:
                continue

            try:
                record = json.loads(stripped)
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSONL at {path}:{line_number}: {error.msg}") from error
            validate_chat_record(record, path, line_number, expected_record_schema_version)
            records.append(record)

    return records


def validate_chat_record(record: Any, path: Path, line_number: int, expected_record_schema_version: int) -> None:
    if not isinstance(record, dict) or not isinstance(record.get("messages"), list):
        raise ValueError(f"Invalid chat record at {path}:{line_number}")

    if record.get("schemaVersion") != expected_record_schema_version:
        raise ValueError(f"Invalid record schema at {path}:{line_number}: expected {expected_record_schema_version}")

    assistant_contents: list[str] = []

    for message_index, message in enumerate(record["messages"]):
        if not isinstance(message, dict):
            raise ValueError(f"Invalid message object at {path}:{line_number}:{message_index}")

        role = message.get("role")
        content = message.get("content")

        if role not in ALLOWED_MESSAGE_ROLES:
            raise ValueError(f"Invalid message role at {path}:{line_number}:{message_index}: {role!r}")

        if not isinstance(content, str) or not content.strip():
            raise ValueError(f"Empty message content at {path}:{line_number}:{message_index}")

        if LOCAL_PATH_PATTERN.search(content):
            raise ValueError(f"Record contains possible local path at {path}:{line_number}:{message_index}")

        if CHAT_ARCHIVE_PATTERN.search(content):
            raise ValueError(f"Record contains raw chat archive marker at {path}:{line_number}:{message_index}")

        if CREDENTIAL_PATTERN.search(content):
            raise ValueError(f"Record contains possible credential at {path}:{line_number}:{message_index}")

        if INVISIBLE_UNICODE_PATTERN.search(content):
            raise ValueError(f"Record contains invisible Unicode control characters at {path}:{line_number}:{message_index}")

        if role == "assistant":
            assistant_contents.append(content.strip())

    if not assistant_contents:
        raise ValueError(f"Record is missing assistant content at {path}:{line_number}")

    if all(len(content) < MIN_ASSISTANT_CONTENT_LENGTH for content in assistant_contents):
        raise ValueError(f"Assistant content is too short at {path}:{line_number}")


def run_cli() -> None:
    args = parse_args()
    try:
        main(args)
    except ValueError as error:
        if args.error_format == "json":
            print(json.dumps({
                "ok": False,
                "error": {
                    "type": "validation_error",
                    "message": str(error),
                },
            }, ensure_ascii=False), file=sys.stderr)
        else:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2) from error


if __name__ == "__main__":
    run_cli()
