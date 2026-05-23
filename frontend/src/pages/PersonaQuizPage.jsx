import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import QuizOptionCard from '../components/QuizOptionCard'
import quizConfig from '../../../config/persona_quiz.json'

const personaOrder = ['gentle_friend', 'local_guide', 'photo_buddy', 'budget_planner', 'game_sprite']

const getRecommendedPersonaId = (answers) => {
  const scores = Object.fromEntries(personaOrder.map((personaId) => [personaId, 0]))

  answers.forEach((answer) => {
    Object.entries(answer?.scores || {}).forEach(([personaId, value]) => {
      scores[personaId] = (scores[personaId] || 0) + value
    })
  })

  return personaOrder.reduce((winner, personaId) => (scores[personaId] > scores[winner] ? personaId : winner), personaOrder[0])
}

function PersonaQuizPage({ onBack, onUsePersona }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [showResult, setShowResult] = useState(false)
  const question = quizConfig.questions[step]
  const selectedOption = answers[step]
  const recommendedPersonaId = useMemo(() => getRecommendedPersonaId(answers), [answers])
  const result = quizConfig.results[recommendedPersonaId]

  const handleSelect = (option) => {
    const nextAnswers = [...answers]
    nextAnswers[step] = option
    setAnswers(nextAnswers)
  }

  const handleNext = () => {
    if (!selectedOption) return
    if (step >= quizConfig.questions.length - 1) {
      setShowResult(true)
      return
    }
    setStep((current) => current + 1)
  }

  if (showResult) {
    return (
      <section className="page persona-quiz-page">
        <button type="button" className="text-back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          回到搭子列表
        </button>

        <article className="quiz-result-card">
          <div className="quiz-result-stamp">
            <Sparkles size={24} />
          </div>
          <p className="eyebrow">推荐搭子</p>
          <h1>{result.name}</h1>
          <p className="lead">{result.summary}</p>

          <div className="quiz-tag-row">
            {result.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="quiz-scenes">
            <h2>适合这些时刻</h2>
            {result.scenes.map((scene) => (
              <p key={scene}>
                <Check size={15} />
                {scene}
              </p>
            ))}
          </div>

          <button type="button" className="primary-button full" onClick={() => onUsePersona(recommendedPersonaId)}>
            一键使用这个搭子
          </button>
        </article>
      </section>
    )
  }

  return (
    <section className="page persona-quiz-page">
      <button type="button" className="text-back-button" onClick={onBack}>
        <ArrowLeft size={17} />
        回到搭子列表
      </button>

      <div className="page-intro">
        <p className="eyebrow">
          {quizConfig.title} · {step + 1}/{quizConfig.questions.length}
        </p>
        <h1>{question.title}</h1>
        <p className="lead">{quizConfig.subtitle}</p>
      </div>

      <div className="quiz-option-list">
        {question.options.map((option) => (
          <QuizOptionCard
            key={option.id}
            option={option}
            selected={selectedOption?.id === option.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <button type="button" className="primary-button full" onClick={handleNext} disabled={!selectedOption}>
        {step >= quizConfig.questions.length - 1 ? '查看推荐搭子' : '下一题'}
      </button>
    </section>
  )
}

export default PersonaQuizPage
