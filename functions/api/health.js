export function onRequest() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'writing-bloom-pages-functions',
      routes: ['/api/health', '/api/prompt', '/api/feedback'],
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
