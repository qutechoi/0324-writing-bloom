const DEFAULT_MODEL = 'claude-3-5-haiku-latest'

export async function onRequestPost(context) {
  try {
    const { request, env } = context
    const body = await request.json().catch(() => ({}))
    const topic = body?.topic?.trim()
    const unit = body?.unit === 'sentence' ? 'sentence' : 'paragraph'
    const writing = body?.writing?.trim()

    if (!topic || !writing) {
      return jsonResponse({ error: '주제와 작성 내용을 함께 보내주세요.' }, 400)
    }

    if (!env.ANTHROPIC_API_KEY) {
      return jsonResponse({
        error: 'ANTHROPIC_API_KEY가 설정되지 않았어요. Cloudflare Pages 환경 변수를 확인해주세요.',
      }, 500)
    }

    const model = env.CLAUDE_MODEL || DEFAULT_MODEL
    const prompt = [
      'You are a warm but honest Korean writing coach.',
      `The user wrote a ${unit} in Korean based on this topic: ${topic}`,
      `User writing: ${writing}`,
      'Give feedback in Korean.',
      'Respond in valid JSON only with the following shape:',
      '{"overall":"...","strengths":["...","..."],"improvements":["...","..."],"nextPrompt":"..."}',
      'Keep overall under 120 Korean characters.',
      'Provide exactly 2 strengths and exactly 2 improvements.',
      'The feedback should focus on clarity, imagery, rhythm, emotional precision, and specificity.',
      'Do not use markdown fences or any extra commentary.',
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
        max_tokens: 500,
        temperature: 0.5,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return jsonResponse({ error: data?.error?.message || 'Claude가 피드백을 생성하지 못했어요.' }, response.status)
    }

    const text = extractText(data)
    const parsed = safeParseJson(text)

    if (!parsed) {
      return jsonResponse({ error: 'Claude 응답을 해석하지 못했어요. 잠시 후 다시 시도해주세요.' }, 502)
    }

    return jsonResponse({
      overall: parsed.overall || '짧지만 중심이 느껴지는 글이에요. 이미지와 감정을 조금 더 또렷하게 붙이면 더 좋아져요.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : ['주제 의식이 분명해요.', '문장 흐름이 자연스러워요.'],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 2) : ['이미지를 조금 더 구체화해보세요.', '핵심 감정을 한 번 더 선명하게 표현해보세요.'],
      nextPrompt: parsed.nextPrompt || '같은 장면을 이번에는 냄새와 소리 중심으로 다시 써보세요.',
    })
  } catch (error) {
    return jsonResponse({ error: error.message || '피드백 생성 중 오류가 발생했어요.' }, 500)
  }
}

function extractText(data) {
  return data?.content?.filter((item) => item.type === 'text').map((item) => item.text).join('\n') || ''
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
    },
  })
}
