import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    if (!achievement) return undefined
    const timer = window.setTimeout(() => {
      onDismiss?.(achievement.id)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [achievement, onDismiss])

  if (!achievement) return null

  return (
    <button type="button" className="achievement-toast glass-card" onClick={() => onDismiss?.(achievement.id)} aria-label="关闭成就提示">
      <span className="achievement-toast-icon">
        <Sparkles size={18} />
      </span>
      <div className="achievement-toast-copy">
        <strong>{achievement.title}</strong>
        <p>{achievement.description}</p>
      </div>
    </button>
  )
}

export default AchievementToast
