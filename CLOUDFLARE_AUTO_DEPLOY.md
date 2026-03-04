# Cloudflare Git Auto Deploy

This repo is configured for **Cloudflare Workers Builds** (Git integration).

## 1) Connect repository

1. Cloudflare Dashboard -> Workers & Pages
2. Create application -> Import a repository
3. Choose your GitHub/GitLab repo
4. Pick branch (usually `main`)

## 2) Build settings in Cloudflare

Set these commands in the Build configuration:

- Install command:

```bash
npm run cf:install
```

- Build command (for preview/non-production):

```bash
npm run cf:build
```

- Deploy command (for production):

```bash
npm run cf:deploy
```

## 3) Environment secret

In Worker -> Settings -> Variables and Secrets, add:

- `SIMPLETEX_UAT` (Secret)

Without this secret, `/upload` returns: `Missing SIMPLETEX_UAT secret in Worker environment`.

## 4) What happens on push

- Push to non-production branch/PR: Cloudflare runs preview build (`versions upload`).
- Push to production branch: Cloudflare runs deploy (`deploy`) and updates your `workers.dev` URL.

## 5) Optional custom domain

Worker -> Settings -> Domains -> Add custom domain.
