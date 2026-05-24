import { useMemo, useRef } from 'react'
import { getCompanionAvatar } from '../config/personaAssets'

const ORBIT_LIMIT = 5
const START_ANGLE = -70
const END_ANGLE = 70
const SWIPE_THRESHOLD = 40

const toRadians = (angle) => (angle * Math.PI) / 180

function CompanionOrbitSelector({ companions, selectedIndex, onSelect, onPrevious, onNext, onCustomize, showSwipeHint }) {
  const startXRef = useRef(null)
  const selectedCompanion = companions[selectedIndex] || companions[0]
  const selectedAvatar = selectedCompanion?.avatar || getCompanionAvatar(selectedCompanion)

  const orbitCompanions = useMemo(() => {
    if (!companions.length) return []

    const rest = companions.filter((_, index) => index !== selectedIndex)
    return rest.slice(0, ORBIT_LIMIT).map((companion, index, array) => {
      const angle = array.length === 1 ? 0 : START_ANGLE + ((END_ANGLE - START_ANGLE) / (array.length - 1)) * index
      const radiusX = 42
      const radiusY = 34

      return {
        ...companion,
        angle,
        x: 50 + radiusX * Math.cos(toRadians(angle)),
        y: 52 + radiusY * Math.sin(toRadians(angle)),
        scale: 0.82 + (1 - Math.abs(angle) / 90) * 0.14,
        avatarSrc: companion.avatar || getCompanionAvatar(companion),
      }
    })
  }, [companions, selectedIndex])

  const handleTouchStart = (event) => {
    startXRef.current = event.touches?.[0]?.clientX ?? null
  }

  const handleTouchEnd = (event) => {
    const startX = startXRef.current
    const endX = event.changedTouches?.[0]?.clientX ?? null
    startXRef.current = null
    if (startX === null || endX === null) return

    const deltaX = endX - startX
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

    if (deltaX < 0) {
      onNext?.()
    } else {
      onPrevious?.()
    }
  }

  return (
    <section className="orbit-selector-shell">
      <div className="orbit-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="orbit-nebula orbit-nebula-left" aria-hidden="true" />
        <div className="orbit-nebula orbit-nebula-right" aria-hidden="true" />
        <div className="orbit-ring orbit-ring-a" aria-hidden="true" />
        <div className="orbit-ring orbit-ring-b" aria-hidden="true" />

        <div className="orbit-center-buddy">
          <button type="button" className="orbit-center-avatar" onClick={() => onSelect(selectedIndex)} aria-label={selectedCompanion?.name}>
            <img className="persona-avatar-image orbit-avatar-image orbit-avatar-image-large" src={selectedAvatar} alt={selectedCompanion?.name || 'SoloMate'} />
          </button>
          <span className="orbit-center-name">{selectedCompanion?.name || 'SoloMate'}</span>
        </div>

        {orbitCompanions.map((companion) => (
          <div
            key={companion.id}
            className={`orbit-item ${companion.isCustomize ? 'is-customize' : ''}`}
            style={{
              left: `${companion.x}%`,
              top: `${companion.y}%`,
              transform: `translate(-50%, -50%) scale(${companion.scale})`,
            }}
          >
            <button
              type="button"
              className="orbit-avatar-button"
              onClick={() => (companion.isCustomize ? onCustomize?.() : onSelect(companion.index))}
              aria-label={companion.name}
            >
              <img className="persona-avatar-image orbit-avatar-image" src={companion.avatarSrc} alt={companion.name} />
            </button>
            <span className="orbit-item-name">{companion.name}</span>
          </div>
        ))}
      </div>

      {showSwipeHint ? <p className="orbit-swipe-hint">左右滑动查看更多搭子</p> : null}
    </section>
  )
}

export default CompanionOrbitSelector
