import { Link } from 'react-router-dom'
import BadgeCard from '../components/BadgeCard'
import TaskCard from '../components/TaskCard'
import { badges, tasks } from '../services/api'
import { completeTask, getDemoState } from '../store/demoState'
import { useState } from 'react'

function BadgePage() {
  const [state, setState] = useState(getDemoState())

  return (
    <section className="page">
      <p className="eyebrow">城市任务</p>
      <h1>小任务，小确定感</h1>
      <p className="lead">徽章从 localStorage 读取。Demo 中也可以直接点击完成任务，模拟当天探索进度。</p>

      <div className="card-stack">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            done={state.completedTasks.includes(task.id)}
            onComplete={(item) => {
              completeTask(item.id, item.rewardBadge)
              setState(getDemoState())
            }}
          />
        ))}
      </div>

      <h2>我的徽章</h2>
      <div className="badge-grid">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} unlocked={state.badges.includes(badge.id)} />
        ))}
      </div>

      <Link className="primary-button full" to="/diary">
        生成今日旅行日记
      </Link>
    </section>
  )
}

export default BadgePage
