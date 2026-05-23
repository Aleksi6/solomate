import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

function PersonaCard({ persona, active, onSelect }) {
  return (
    <motion.button
      type="button"
      className={`persona-card ${active ? 'is-active' : ''}`}
      onClick={() => onSelect(persona.id)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
    >
      <span className="avatar-bubble">{persona.avatar}</span>
      <span className="card-copy">
        <span className="card-title">{persona.name}</span>
        <span className="muted">{persona.tagline}</span>
        <span className="tone-line">
          <Sparkles size={14} />
          {persona.tone}
        </span>
      </span>
      {active && <Check className="card-check" size={19} />}
    </motion.button>
  )
}

export default PersonaCard
