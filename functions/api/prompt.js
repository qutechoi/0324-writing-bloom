const DEFAULT_MODEL = 'claude-3-5-haiku-latest'

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true })
  }

  if (request.method === 'GET') {
    return jsonResponse({
      ok: true,
      route: '/api/prompt',
      message: 'POST로 unit(sentence|paragraph)을 보내면 Claude가 글감을 생성합니다.',
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const { env } = context
    const body = await request.json().catch(() => ({}))
    const unit = body?.unit === 'sentence' ? 'sentence' : 'paragraph'

    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        {
          error: 'ANTHROPIC_API_KEY가 설정되지 않았어요. Cloudflare Pages 환경 변수를 확인해주세요.',
        },
        500,
      )
    }

    const model = env.CLAUDE_MODEL || DEFAULT_MODEL
    const prompt = [
      'You are a playful writing coach for a cute Korean writing practice app.',
      `Generate one creative writing prompt for a user who will write a ${unit}.`,
      'Return JSON only with this shape: {"prompt":"..."}.',
      'The prompt should be concise, evocative, and in Korean.',
      'Do not include markdown fences or any extra commentary.',
    ].join(' ')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 180,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return jsonResponse(
        { error: data?.error?.message || 'Claude가 글감을 생성하지 못했어요.' },
        response.status,
      )
    }

    const text = extractText(data)
    const parsed = safeParseJson(text)

    return jsonResponse({
      prompt: parsed?.prompt || '낯선 도시에서 오늘 하루만 이름을 바꿔 살게 된다면?',
    })
  } catch (error) {
    return jsonResponse({ error: error.message || '글감 생성 중 오류가 발생했어요.' }, 500)
  }
}

function extractText(data) {
  return data?.content
    ?.filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n') || ''
}

function safeParseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    },
  })
}
