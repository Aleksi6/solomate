import { Camera, ImagePlus } from 'lucide-react'

const modes = [
  { id: 'environment', label: '看看我在哪', icon: Camera },
  { id: 'souvenir', label: '收藏这个瞬间', icon: ImagePlus },
]

function PhotoModeTabs({ activeMode, onChange }) {
  return (
    <div className="photo-mode-tabs photo-pill-tabs" role="tablist" aria-label="拍照模式">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = activeMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`photo-mode-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(mode.id)}
          >
            <Icon size={17} />
            <span>{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default PhotoModeTabs
