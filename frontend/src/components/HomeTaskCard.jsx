import { Link } from 'react-router-dom'
import { Camera, CheckCircle2, Heart, MessageCircle } from 'lucide-react'

const iconMap = {
  chat: MessageCircle,
  photo: Camera,
  mood: Heart,
}

function HomeTaskCard({ task }) {
  const Icon = iconMap[task.icon] || CheckCircle2

  return (
    <Link className={`home-task-card soft-card ${task.status ? 'is-done' : ''}`} to={task.to}>
      <div className="home-task-card-head">
        <span className="home-task-icon">
          <Icon size={18} />
        </span>
        <span className={`home-task-state ${task.status ? 'is-done' : ''}`}>{task.status ? '已完成' : '去完成'}</span>
      </div>
      <strong>{task.title}</strong>
      <p>{task.description}</p>
      <small>奖励：{task.reward}</small>
    </Link>
  )
}

export default HomeTaskCard
