# Writing Bloom

아기자기한 글쓰기 연습 웹앱입니다. 랜덤 글감 또는 직접 입력한 주제를 바탕으로 한 문장/한 단락 글쓰기를 해보고, Claude Haiku 기반 피드백을 받을 수 있습니다.

## Stack

- React + Vite
- Cloudflare Pages Functions
- Anthropic Messages API (Claude Haiku)

## Features

- 랜덤 글감 생성
- 특정 주제 직접 입력
- 한 문장 / 한 단락 모드 선택
- Claude Haiku 피드백 생성
- 귀엽고 부드러운 파스텔 UI
- 로딩/에러 상태 처리

## Local development

```bash
npm install
npm run build
```

Vite 프런트만 확인하려면:

```bash
npm run dev
```

Cloudflare Pages Functions까지 함께 확인하려면 Wrangler 사용을 권장합니다.

```bash
npm install -D wrangler
npx wrangler pages dev dist --compatibility-date=2026-03-24
```

빌드 산출물이 먼저 필요하므로 아래 순서가 안전합니다.

```bash
npm run build
npx wrangler pages dev dist --compatibility-date=2026-03-24
```

## Cloudflare Pages setup

Cloudflare Pages 프로젝트 설정:

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`

Pages 환경 변수:

- `ANTHROPIC_API_KEY` : Anthropic API key
- `CLAUDE_MODEL` : 선택 사항. 기본값은 `claude-3-5-haiku-latest`

## API routes

- `GET /api/health` : Functions 라우팅 확인용
- `GET|POST /api/prompt` : 랜덤 글감 생성
- `GET|POST /api/feedback` : 작성글 피드백 생성

두 API는 모두 Cloudflare Pages Functions에서 동작하므로 브라우저에 API 키가 노출되지 않습니다.
배포 후 먼저 `/api/health` 에 접속해서 Functions가 잡히는지 확인할 수 있습니다.

## Notes

- 기본 모델은 `claude-3-5-haiku-latest`로 설정했습니다.
- Anthropic에서 최신 Haiku alias/model 명칭이 바뀌면 `CLAUDE_MODEL`만 수정하면 됩니다.
- Claude 응답은 JSON으로 강제하고, 파싱 실패 시 오류 메시지를 반환하도록 처리했습니다.
