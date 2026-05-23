import { Mic } from 'lucide-react'
import { motion } from 'framer-motion'

function VoiceButton({ onClick, label = '语音陪伴' }) {
  return (
    <motion.button
      type="button"
      className="voice-button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      aria-label={label}
      title={label}
    >
      <Mic size={20} />
      <span>{label}</span>
    </motion.button>
  )
}

export default VoiceButton
