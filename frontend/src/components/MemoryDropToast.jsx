import { Sparkles, X } from 'lucide-react'

function MemoryDropToast({ drop, onClose }) {
  if (!drop) return null

  const rarityLabel = drop.rarity === 'rare' ? '稀有掉落' : '新的掉落'

  return (
    <aside className="memory-drop-toast" role="status" aria-live="polite">
      <div className="memory-drop-icon">
        <Sparkles size={20} />
      </div>
      <div>
        <p>{rarityLabel}</p>
        <h3>{drop.title}</h3>
        <span>{drop.description}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="关闭掉落提示">
        <X size={16} />
      </button>
    </aside>
  )
}

export default MemoryDropToast
