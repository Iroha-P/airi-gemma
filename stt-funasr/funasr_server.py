"""FunASR Paraformer - OpenAI Compatible STT Server

Wraps Alibaba DAMO Paraformer model as an OpenAI-compatible
/v1/audio/transcriptions endpoint for use with AIRI.

Usage:
    ..\stt-funasr\Scripts\python.exe funasr_server.py
"""
import os
import tempfile

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="FunASR Paraformer STT Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy-load model on first request to speed up server startup
_model = None
_device = "cpu"  # default CPU to save VRAM for LLM


def get_model():
    global _model
    if _model is None:
        from funasr import AutoModel
        kwargs = dict(
            model="paraformer-zh",
            vad_model="fsmn-vad",
            punc_model="ct-punc",
        )
        if _device == "cpu":
            kwargs["device"] = "cpu"
        _model = AutoModel(**kwargs)
        print(f"Model loaded: paraformer-zh on {_device}")
    return _model


@app.get("/")
async def health():
    return {"status": "ok", "model": "paraformer-zh", "device": _device}


@app.post("/config")
async def update_config(device: str = Form(default=None)):
    """Switch between CPU and CUDA at runtime. Reloads the model."""
    global _model, _device
    if device and device in ("cpu", "cuda"):
        _device = device
        if device == "cpu":
            os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
        elif "CUDA_VISIBLE_DEVICES" in os.environ:
            del os.environ["CUDA_VISIBLE_DEVICES"]
        _model = None  # force reload on next request
        return {"status": "ok", "device": _device}
    return JSONResponse(
        {"error": "device must be 'cpu' or 'cuda'"},
        status_code=400,
    )


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form(default="paraformer-zh"),
    language: str = Form(default="zh"),
):
    audio_bytes = await file.read()

    suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        m = get_model()
        result = m.generate(input=tmp_path)
        text = result[0]["text"] if result else ""
    finally:
        os.unlink(tmp_path)

    return JSONResponse({"text": text})


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
