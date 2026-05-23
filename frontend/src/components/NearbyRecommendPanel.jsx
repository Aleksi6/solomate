import { Compass } from 'lucide-react'
import PlaceCard from './PlaceCard'
import TaskCard from './TaskCard'

function NearbyRecommendPanel({ places, activeTask, done, onVisit, onComplete }) {
  return (
    <details className="nearby-recommend-panel nearby-panel glass-card">
      <summary>
        <span className="nearby-summary-copy">
          <Compass size={16} />
          {'\u9644\u8fd1\u63a8\u8350'}
        </span>
        <span className="nearby-summary-meta">{'\u6536\u8d77 / \u5c55\u5f00'}</span>
      </summary>

      <div className="nearby-recommend-body">
        <p className="nearby-recommend-copy">
          {
            '\u5982\u679c\u4f60\u60f3\u505c\u4e00\u505c\uff0c\u6211\u5148\u5e2e\u4f60\u628a\u9644\u8fd1\u51e0\u4e2a\u8f7b\u677e\u7684\u53bb\u5904\u6536\u5728\u8fd9\u91cc\u3002'
          }
        </p>

        <div className="card-stack">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} onVisit={onVisit} />
          ))}
        </div>

        {activeTask ? <TaskCard task={activeTask} done={done} onComplete={onComplete} /> : null}
      </div>
    </details>
  )
}

export default NearbyRecommendPanel
