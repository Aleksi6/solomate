import { Flag, Gift } from 'lucide-react'

function TaskCard({ task, done, onComplete }) {
  return (
    <article className={`task-card ${done ? 'is-done' : ''}`}>
      <div className="task-icon">
        <Flag size={20} />
      </div>
      <div>
        <h3>{task.title}</h3>
        <p>{task.description}</p>
        <span className="reward">
          <Gift size={15} />
          {task.rewardName}
        </span>
      </div>
      {onComplete && (
        <button type="button" className="mini-button" onClick={() => onComplete(task)}>
          {done ? '已完成' : '完成'}
        </button>
      )}
    </article>
  )
}

export default TaskCard
