import { useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'

function ChatMessageList({ messages }) {
  const listRef = useRef(null)

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  return (
    <section className="chat-message-shell glass-card">
      <div ref={listRef} className="chat-message-window chat-message-list" aria-label={'\u804a\u5929\u8bb0\u5f55'}>
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </div>
    </section>
  )
}

export default ChatMessageList
