function QuizOptionCard({ option, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`quiz-option-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(option)}
    >
      <span>{option.title}</span>
      <small>{option.description}</small>
    </button>
  )
}

export default QuizOptionCard
