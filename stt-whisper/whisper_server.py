"""faster-whisper - OpenAI Compatible STT Server

Wraps faster-whisper as an OpenAI-compatible
/v1/audio/transcriptions endpoint for use with AIRI.

Usage:
    ..\stt-whisper\Scripts\python.exe whisper_server.py
"""
import os
import tempfile

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="Faster-Whisper STT Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_model_name = os.environ.get("WHISPER_MODEL", "small")
_device = os.environ.get("WHISPER_DEVICE", "cpu")
_compute_type = os.environ.get("WHISPER_COMPUTE", "int8")


def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(_model_name, device=_device, compute_type=_compute_type)
        print(f"Model loaded: {_model_name} on {_device} ({_compute_type})")
    return _model


@app.get("/")
async def health():
    return {
        "status": "ok",
        "model": _model_name,
        "device": _device,
        "compute_type": _compute_type,
    }


@app.post("/config")
async def update_config(device: str = Form(default=None)):
    """Switch between CPU and CUDA at runtime. Reloads the model."""
    global _model, _device, _compute_type
    if device and device in ("cpu", "cuda"):
        _device = device
        _compute_type = "int8" if device == "cpu" else "float16"
        _model = None  # force reload on next request
        return {"status": "ok", "device": _device, "compute_type": _compute_type}
    return JSONResponse(
        {"error": "device must be 'cpu' or 'cuda'"},
        status_code=400,
    )


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form(default="small"),
    language: str = Form(default=None),
):
    audio_bytes = await file.read()

    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        m = get_model()
        segments, _info = m.transcribe(
            tmp_path,
            language=language if language else None,
        )
        text = "".join(seg.text for seg in segments)
    finally:
        os.unlink(tmp_path)

    return JSONResponse({"text": text})


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
