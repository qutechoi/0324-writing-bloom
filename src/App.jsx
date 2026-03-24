import { useMemo, useState } from 'react'
import './App.css'

const unitOptions = [
  {
    value: 'sentence',
    label: '한 문장',
    description: '짧고 선명하게 한 문장으로 써요.',
    placeholder: '오늘의 기분을 한 문장으로 적어볼까요?',
  },
  {
    value: 'paragraph',
    label: '한 단락',
    description: '조금 더 넉넉하게 한 단락으로 써요.',
    placeholder: '장면, 감정, 생각을 한 단락으로 풀어 써보세요.',
  },
]

const pastelPrompts = [
  '비 오는 날 우산 아래에서 우연히 들은 한마디',
  '5년 뒤의 나에게 보내는 짧은 편지',
  '새벽 편의점에서 만난 이상한 손님',
  '오늘 하루를 색깔 하나로 표현한다면',
  '고양이가 내 비밀을 알고 있다면',
  '사라진 기억 하나가 돌아온 순간',
]

function App() {
  const [mode, setMode] = useState('random')
  const [unit, setUnit] = useState('paragraph')
  const [customTopic, setCustomTopic] = useState('')
  const [activePrompt, setActivePrompt] = useState(pastelPrompts[0])
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isPromptLoading, setIsPromptLoading] = useState(false)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  const [error, setError] = useState('')

  const currentUnit = useMemo(
    () => unitOptions.find((option) => option.value === unit) ?? unitOptions[0],
    [unit],
  )

  const resolvedTopic = mode === 'custom' ? customTopic.trim() : activePrompt
  const minimumLength = unit === 'sentence' ? 15 : 80

  const handleRandomPrompt = async () => {
    setMode('random')
    setError('')
    setFeedback(null)
    setIsPromptLoading(true)

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '글감을 불러오지 못했어요.')
      }

      setActivePrompt(data.prompt)
    } catch (fetchError) {
      const fallback = pastelPrompts[Math.floor(Math.random() * pastelPrompts.length)]
      setActivePrompt(fallback)
      setError(fetchError.message || '랜덤 글감을 가져오지 못해서 기본 글감으로 바꿨어요.')
    } finally {
      setIsPromptLoading(false)
    }
  }

  const handleGetFeedback = async () => {
    const trimmedDraft = draft.trim()
    const trimmedTopic = resolvedTopic.trim()

    if (!trimmedTopic) {
      setError('먼저 글감을 정해주세요.')
      return
    }

    if (trimmedDraft.length < minimumLength) {
      setError(
        unit === 'sentence'
          ? '한 문장 모드에서는 조금 더 또렷하게 써주면 좋아요. 최소 15자 정도 부탁해요.'
          : '한 단락 모드에서는 최소 80자 정도 써주면 더 정확한 피드백을 줄 수 있어요.',
      )
      return
    }

    setError('')
    setIsFeedbackLoading(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          unit,
          writing: trimmedDraft,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || '피드백을 가져오지 못했어요.')
      }

      setFeedback(data)
    } catch (fetchError) {
      setError(fetchError.message || '피드백 요청에 실패했어요.')
    } finally {
      setIsFeedbackLoading(false)
    }
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setError('')
    setFeedback(null)
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Writing Bloom</span>
          <h1>귀엽고 다정한 글쓰기 연습실</h1>
          <p>
            랜덤 글감이나 원하는 주제를 받아서 짧게 써보고,
            Claude Haiku 기반 피드백으로 문장 힘을 조금씩 키워보세요.
          </p>
        </div>
        <div className="hero-orbs" aria-hidden="true">
          <span className="orb orb-peach" />
          <span className="orb orb-lilac" />
          <span className="orb orb-mint" />
        </div>
      </section>

      <section className="grid-layout">
        <article className="panel soft-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">STEP 1</p>
              <h2>글감 고르기</h2>
            </div>
            <button className="ghost-button" type="button" onClick={handleRandomPrompt} disabled={isPromptLoading}>
              {isPromptLoading ? '글감 찾는 중…' : '랜덤 글감 새로 받기'}
            </button>
          </div>

          <div className="toggle-row">
            <button
              type="button"
              className={mode === 'random' ? 'toggle-pill active' : 'toggle-pill'}
              onClick={() => handleModeChange('random')}
            >
              랜덤 글감
            </button>
            <button
              type="button"
              className={mode === 'custom' ? 'toggle-pill active' : 'toggle-pill'}
              onClick={() => handleModeChange('custom')}
            >
              직접 주제 입력
            </button>
          </div>

          {mode === 'custom' ? (
            <label className="field-wrap">
              <span>원하는 주제</span>
              <input
                type="text"
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                placeholder="예: 봄밤 산책, 퇴사 후 첫날, 내 방의 냄새"
              />
            </label>
          ) : (
            <div className="prompt-card">
              <span className="prompt-badge">오늘의 글감</span>
              <p>{activePrompt}</p>
            </div>
          )}

          <div className="unit-grid">
            {unitOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={unit === option.value ? 'unit-card active' : 'unit-card'}
                onClick={() => setUnit(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel cream-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">STEP 2</p>
              <h2>써보기</h2>
            </div>
            <span className="helper-chip">현재 모드: {currentUnit.label}</span>
          </div>

          <div className="topic-preview">
            <span>선택된 글감</span>
            <strong>{resolvedTopic || '아직 주제를 정하지 않았어요.'}</strong>
          </div>

          <label className="field-wrap textarea-wrap">
            <span>당신의 문장</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={currentUnit.placeholder}
              rows={unit === 'sentence' ? 6 : 10}
            />
          </label>

          <div className="editor-footer">
            <span>{draft.trim().length}자</span>
            <button className="primary-button" type="button" onClick={handleGetFeedback} disabled={isFeedbackLoading}>
              {isFeedbackLoading ? '피드백 받는 중…' : '피드백 받기'}
            </button>
          </div>
        </article>
      </section>

      {error ? <div className="status-banner error">{error}</div> : null}

      <section className="panel result-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">STEP 3</p>
            <h2>Claude Haiku 피드백</h2>
          </div>
          <span className="helper-chip">Cloudflare Pages Functions</span>
        </div>

        {feedback ? (
          <div className="feedback-grid">
            <div className="feedback-card highlight">
              <h3>총평</h3>
              <p>{feedback.overall}</p>
            </div>
            <div className="feedback-card">
              <h3>잘된 점</h3>
              <ul>
                {feedback.strengths.map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="feedback-card">
              <h3>더 좋아질 점</h3>
              <ul>
                {feedback.improvements.map((item, index) => (
                  <li key={`improvement-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="feedback-card accent">
              <h3>다음 연습 제안</h3>
              <p>{feedback.nextPrompt}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>글을 쓰고 나면 이곳에 다정하지만 솔직한 피드백이 도착해요.</p>
            <span>문장 리듬, 선명도, 감정 전달, 구체성 중심으로 살펴봐줄 거예요.</span>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
