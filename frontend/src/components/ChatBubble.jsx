import { motion } from 'framer-motion'

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      className={`chat-row ${isUser ? 'from-user' : 'from-buddy'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="chat-bubble">
        <p>{message.text}</p>
        <span>{message.time || '刚刚'}</span>
      </div>
    </motion.div>
  )
}

export default ChatBubble
