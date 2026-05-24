import { motion } from 'framer-motion'

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const isProactive = message.message_type === 'proactive'

  return (
    <motion.div
      className={`chat-row ${isUser ? 'from-user' : 'from-buddy'} ${isProactive ? 'is-proactive' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="chat-bubble">
        {isProactive ? <small className="chat-bubble-badge">搭子主动来了一句</small> : null}
        <p>{message.text}</p>
        <span>{message.time || '刚刚'}</span>
      </div>
    </motion.div>
  )
}

export default ChatBubble
