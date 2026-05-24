import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import MemoryTimeline from '../components/MemoryTimeline'
import { getMergedMemoryTimeline } from '../utils/memoryStorage'

function BadgePage() {
  const items = getMergedMemoryTimeline()

  return (
    <section className="page memory-page diffuse-bg">
      <div className="page-intro memory-timeline-intro">
        <p className="eyebrow">Memory Timeline</p>
        <h1 className="page-title">记忆时间线</h1>
        <p className="page-subtitle">把今天写下的话、寄出的照片、掉落的徽章，都收在同一条路上。</p>
      </div>

      <MemoryTimeline items={items} />

      <Link className="primary-button full" to="/diary">
        <BookOpen size={18} />
        查看今日手账
      </Link>
    </section>
  )
}

export default BadgePage
