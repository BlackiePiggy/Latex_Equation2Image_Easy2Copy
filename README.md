# Latex_Equation2Image_Easy2Copy

LaTeX equation rendering + OCR (SimpleTex API), now running on **Cloudflare Workers + Hono (TypeScript)**.

## Local Dev

1. Install dependencies

```bash
npm install
```

2. Login Cloudflare

```bash
npx wrangler login
```

3. Set secret

```bash
npx wrangler secret put SIMPLETEX_UAT
```

4. Start local runtime

```bash
npm run dev
```

5. Open

- `http://127.0.0.1:8787`

## Deploy

```bash
npm run deploy
```

## Project Structure

- `src/index.ts`: Worker API (`/upload`) + asset fallback
- `public/index.html`: main page
- `public/static/`: JS/CSS/icons
- `wrangler.toml`: Worker + assets config
- `package.json`: dependencies and scripts

## Notes

- `SIMPLETEX_UAT` is read from Worker secret.
- Do not hardcode token in source code.
