import { Hono } from 'hono'

type Bindings = {
  ASSETS: Fetcher
  SIMPLETEX_UAT?: string
}

const SIMPLETEX_API_URL = 'https://server.simpletex.cn/api/latex_ocr_turbo'
const app = new Hono<{ Bindings: Bindings }>()

app.post('/upload', async (c) => {
  const token = c.env.SIMPLETEX_UAT
  if (!token) {
    return c.json({ error: 'Missing SIMPLETEX_UAT secret in Worker environment' }, 500)
  }

  const form = await c.req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400)
  }

  const upstreamForm = new FormData()
  upstreamForm.append('file', file, file.name || 'upload.png')

  try {
    const upstreamResp = await fetch(SIMPLETEX_API_URL, {
      method: 'POST',
      headers: { token },
      body: upstreamForm,
    })

    const payload = await upstreamResp.text()
    return new Response(payload, {
      status: upstreamResp.status,
      headers: {
        'content-type': upstreamResp.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

app.all('*', async (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
