import { Mic, Send } from 'lucide-react'
import useSpeechRecognition from '../hooks/useSpeechRecognition'

const TEXT = {
  placeholder: '\u544a\u8bc9\u6211\u4f60\u73b0\u5728\u5728\u54ea\u3001\u611f\u89c9\u600e\u4e48\u6837\uff0c\u6216\u8005\u60f3\u53bb\u54ea',
  inputLabel: '\u8f93\u5165\u6d88\u606f',
  listening: '\u6b63\u5728\u542c',
  pressToTalk: '\u6309\u4f4f\u8bf4\u8bdd',
  hintError: '\u8bed\u97f3\u8bc6\u522b\u6709\u70b9\u4e0d\u7a33\u5b9a\uff0c\u7ee7\u7eed\u7528\u6587\u5b57\u8f93\u5165\u4e5f\u6ca1\u5173\u7cfb',
  hintIdle: '\u6309\u4f4f\u9ea6\u514b\u98ce\u8bf4\u8bdd\uff0c\u677e\u5f00\u540e\u4f1a\u81ea\u52a8\u53d1\u9001',
  transcriptPrefix: '\u6b63\u5728\u542c\uff1a',
}

function ChatComposer({ disabled, isSubmitting, text, onChange, onSubmit, onVoiceMessage }) {
  const speechRecognition = useSpeechRecognition({
    onFinalTranscript: (finalText) => {
      onVoiceMessage?.(finalText)
      speechRecognition.resetTranscript()
    },
  })

  const handlePressStart = () => {
    if (disabled || isSubmitting) return
    speechRecognition.startListening()
  }

  const handlePressEnd = () => {
    if (!speechRecognition.isListening) return
    speechRecognition.stopListening()
  }

  return (
    <div className="chat-composer-shell glass-card">
      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit?.()
        }}
      >
        <input
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={TEXT.placeholder}
          aria-label={TEXT.inputLabel}
        />

        <button type="submit" className="primary-button chat-send-button" disabled={disabled || isSubmitting}>
          <Send size={18} />
        </button>

        <button
          type="button"
          className={`ghost-button chat-mic-button ${speechRecognition.isListening ? 'is-listening' : ''}`}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onClick={() => {
            if (!speechRecognition.isListening) handlePressStart()
          }}
          disabled={!speechRecognition.isSupported || isSubmitting}
          aria-label={speechRecognition.isListening ? TEXT.listening : TEXT.pressToTalk}
          title={speechRecognition.isListening ? TEXT.listening : TEXT.pressToTalk}
        >
          <Mic size={20} />
        </button>
      </form>

      <div className="chat-composer-hint">
        {speechRecognition.isListening
          ? `${TEXT.transcriptPrefix}${speechRecognition.transcript || ''}`
          : speechRecognition.error
            ? TEXT.hintError
            : TEXT.hintIdle}
      </div>

      {speechRecognition.isListening ? <div className="chat-listening-badge">{TEXT.listening}</div> : null}
    </div>
  )
}

export default ChatComposer
