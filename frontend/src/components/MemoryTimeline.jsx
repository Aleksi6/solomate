import { Camera, Medal, Sparkles } from 'lucide-react'
import MemoryFragmentCard from './MemoryFragmentCard'
import MomentCard from './MomentCard'

const emptyCopy = '还没有收进今天的瞬间，去拍一张照片或记录一句心情吧。'

function MemoryTimeline({ items }) {
  if (!items.length) {
    return (
      <section className="memory-timeline-empty soft-card">
        <Sparkles size={28} />
        <h2>今天还很轻</h2>
        <p>{emptyCopy}</p>
      </section>
    )
  }

  return (
    <section className="memory-timeline-list" aria-label="记忆时间线">
      {items.map((item) => (
        <div key={item.id} className={`memory-timeline-item variant-${item.cardVariant || 'medium'}`}>
          <div className="memory-timeline-dot" aria-hidden="true">
            {item.type === 'mood_note' ? <Sparkles size={14} /> : item.type === 'souvenir_card' || item.type === 'photo_fragment' ? <Camera size={14} /> : <Medal size={14} />}
          </div>

          <div className="memory-timeline-content">
            {item.type === 'mood_note' || item.type === 'text_note' || item.type === 'moment' ? <MomentCard item={item} /> : <MemoryFragmentCard fragment={item} />}
          </div>
        </div>
      ))}
    </section>
  )
}

export default MemoryTimeline
