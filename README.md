# Latex_Equation2Image_Easy2Copy

LaTeX equation rendering + OCR (SimpleTex API), adapted for **Cloudflare Python Workers**.

## Fast Path: Git Auto Deploy (Recommended)

Use Cloudflare Workers Builds to connect this repo and auto-deploy on push.

- Guide: `CLOUDFLARE_AUTO_DEPLOY.md`

## Local Dev

1. Install tools

```bash
npm i -g wrangler@latest
# install uv first: https://docs.astral.sh/uv/
uv sync
```

2. Login Cloudflare

```bash
wrangler login
```

3. Set secret

```bash
wrangler secret put SIMPLETEX_UAT
```

4. Start local runtime

```bash
uvx --from workers-py pywrangler dev
```

5. Open

- `http://127.0.0.1:8787`

## Manual Deploy

```bash
uvx --from workers-py pywrangler deploy
```

## Project Structure

- `src/index.py`: Worker + FastAPI backend
- `templates/index.html`: main page
- `static/`: JS/CSS/icons
- `wrangler.toml`: Worker config
- `pyproject.toml`: Python dependencies
- `package.json`: CI-friendly scripts for Cloudflare Builds

## Notes

- `SIMPLETEX_UAT` is read from Worker secret.
- Do not hardcode token in source code.
