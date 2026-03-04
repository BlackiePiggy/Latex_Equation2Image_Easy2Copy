from pathlib import Path

import httpx
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from workers import WorkerEntrypoint
from workers.asgi import ASGIApp

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
INDEX_FILE = TEMPLATES_DIR / "index.html"
SIMPLETEX_API_URL = "https://server.simpletex.cn/api/latex_ocr_turbo"

app = FastAPI()


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(INDEX_FILE)


@app.get("/static/{file_path:path}")
async def static_files(file_path: str):
    full_path = (STATIC_DIR / file_path).resolve()
    if not str(full_path).startswith(str(STATIC_DIR.resolve())) or not full_path.is_file():
        return JSONResponse({"error": "Static file not found"}, status_code=404)
    return FileResponse(full_path)


@app.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    token = getattr(request.scope.get("env"), "SIMPLETEX_UAT", None)
    if not token:
        return JSONResponse(
            {"error": "Missing SIMPLETEX_UAT secret in Worker environment"},
            status_code=500,
        )

    data = await file.read()
    files = {"file": (file.filename or "upload.png", data, file.content_type or "application/octet-stream")}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                SIMPLETEX_API_URL,
                files=files,
                headers={"token": token},
            )
        return JSONResponse(resp.json(), status_code=resp.status_code)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)


asgi_app = ASGIApp(app)


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        return await asgi_app.fetch(request, self.env)
