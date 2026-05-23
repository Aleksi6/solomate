import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import personaQuiz from '../config/personaQuiz'
import { buildCompanionProfile } from '../utils/buildCompanionProfile'
import { addCustomCompanion, setActiveCompanionId, setVoiceSettingsForCompanion } from '../utils/companionStorage'

function PersonaQuizPage({ onBack, onComplete, fixedCompanions }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const question = personaQuiz.questions[step]

  const selectedFixedCompanion = useMemo(() => {
    const personalityAnswer = answers.personality
    if (!personalityAnswer?.personaId) return fixedCompanions[0]
    return fixedCompanions.find((companion) => companion.id === personalityAnswer.personaId) || fixedCompanions[0]
  }, [answers.personality, fixedCompanions])

  const canContinue = question.type === 'text' ? true : Boolean(answers[question.id])

  const handleOptionSelect = (option) => {
    setAnswers((current) => ({
      ...current,
      [question.id]: option,
    }))
  }

  const handleInputChange = (event) => {
    setAnswers((current) => ({
      ...current,
      [question.id]: event.target.value,
    }))
  }

  const handleNext = () => {
    if (step >= personaQuiz.questions.length - 1) {
      const normalizedAnswers = {
        personality: answers.personality?.label || '',
        speakingStyle: answers.speakingStyle?.label || '',
        decisionStyle: answers.decisionStyle?.label || '',
        safetyLevel: answers.safetyLevel?.id || '',
        taskPreference: answers.taskPreference?.label || '',
        photoPreference: answers.photoPreference?.label || '',
        voiceStyle: answers.voiceStyle?.label || '',
        customName: answers.customName || '',
      }

      const profile = buildCompanionProfile(normalizedAnswers, selectedFixedCompanion)
      addCustomCompanion(profile)
      setActiveCompanionId(profile.id)
      if (answers.voiceStyle?.defaultVoiceSettings) {
        setVoiceSettingsForCompanion(profile.id, answers.voiceStyle.defaultVoiceSettings)
      }
      onComplete(profile)
      return
    }

    setStep((current) => current + 1)
  }

  return (
    <section className="page persona-quiz-page diffuse-bg">
      <button type="button" className="text-back-button ghost-button" onClick={onBack}>
        <ArrowLeft size={17} />
        回到搭子列表
      </button>

      <div className="page-intro glass-card">
        <p className="eyebrow">
          {personaQuiz.intro.title} · {step + 1}/{personaQuiz.questions.length}
        </p>
        <h1 className="page-title">{question.title}</h1>
        <p className="page-subtitle">{step === 0 ? personaQuiz.intro.subtitle : question.helper || '跟着感觉选就好，没有标准答案。'}</p>
      </div>

      {question.type === 'text' ? (
        <section className="quiz-text-panel glass-card">
          <label className="quiz-text-label" htmlFor="custom-companion-name">
            给搭子留一个你喜欢的称呼
          </label>
          <input
            id="custom-companion-name"
            className="quiz-text-input"
            value={answers[question.id] || ''}
            onChange={handleInputChange}
            placeholder={question.placeholder}
          />
          <small>{question.helper}</small>
        </section>
      ) : (
        <div className="quiz-option-list">
          {question.options.map((option) => {
            const isSelected = answers[question.id]?.id === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`quiz-option-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span>{option.label}</span>
                <small>{option.description}</small>
              </button>
            )
          })}
        </div>
      )}

      <div className="quiz-actions">
        <button type="button" className="ghost-button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
          上一题
        </button>
        <button type="button" className="primary-button" onClick={handleNext} disabled={!canContinue}>
          {step >= personaQuiz.questions.length - 1 ? '生成我的搭子' : '下一题'}
          <ArrowRight size={16} />
        </button>
      </div>

      <article className="quiz-preview-card soft-card">
        <div className="quiz-result-stamp">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="eyebrow">当前偏向</p>
          <h2>{selectedFixedCompanion.name}</h2>
          <p className="page-subtitle">{selectedFixedCompanion.tagline}</p>
        </div>
      </article>
    </section>
  )
}

export default PersonaQuizPage
