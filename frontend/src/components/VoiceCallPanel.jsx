import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef } from 'react'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import VoiceSettings from './VoiceSettings'

function VoiceCallPanel({ isSending = false, lastReply, onVoiceMessage, persona }) {
  const spokenReplyIdRef = useRef('')
  const speechSynthesis = useSpeechSynthesis()
  const speechRecognition = useSpeechRecognition({
    onFinalTranscript: (text) => {
      onVoiceMessage?.(text)
    },
  })

  useEffect(() => {
    if (!lastReply?.id || spokenReplyIdRef.current === lastReply.id) return
    spokenReplyIdRef.current = lastReply.id
    speechSynthesis.speak(lastReply.text)
  }, [lastReply, speechSynthesis])

  const panelState = (() => {
    if (!speechRecognition.isSupported) return 'fallback'
    if (speechRecognition.error) return 'fallback'
    if (isSending) return 'thinking'
    if (speechRecognition.isListening) return 'listening'
    if (speechSynthesis.isSpeaking) return 'speaking'
    return 'idle'
  })()

  const statusText = (() => {
    if (!speechRecognition.isSupported) return '当前浏览器不支持语音识别，文字输入仍然可用'
    if (speechRecognition.error) return '识别有点不稳定，先用文字输入也没关系'
    if (isSending) return '搭子正在想一个更适合你的下一步'
    if (speechRecognition.isListening) return '我在听，你慢慢说'
    if (speechSynthesis.isSpeaking) return '我陪你说完这段路'
    return '我陪你说完这段路'
  })()

  const subText = speechRecognition.transcript
    ? speechRecognition.transcript
    : lastReply?.text || '点击麦克风，开始这一轮陪伴通话'

  return (
    <section className="voice-call-panel call-stage-panel" aria-label="陪伴通话面板">
      <div className="call-stage-top">
        <p className="eyebrow">陪伴通话</p>
        <span className={`call-state-chip is-${panelState}`}>{statusText}</span>
      </div>

      <div className="call-stage-center">
        <div className={`voice-orb voice-wave call-voice-orb is-${panelState}`} aria-hidden="true">
          <span>{persona?.avatar || '✨'}</span>
        </div>
        <div className="call-stage-copy">
          <h2>{persona?.name || 'SoloMate'}</h2>
          <p>{subText}</p>
        </div>
      </div>

      <div className="voice-call-controls">
        <button
          type="button"
          className={`round-control ${speechRecognition.isListening ? 'is-active' : ''}`}
          onClick={speechRecognition.isListening ? speechRecognition.stopListening : speechRecognition.startListening}
          disabled={!speechRecognition.isSupported || isSending}
          aria-label={speechRecognition.isListening ? '停止识别' : '开始识别'}
          title={speechRecognition.isListening ? '停止识别' : '开始识别'}
        >
          {speechRecognition.isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          type="button"
          className={`round-control ${speechSynthesis.isSpeaking ? 'is-active' : ''}`}
          onClick={speechSynthesis.isSpeaking ? speechSynthesis.cancel : () => speechSynthesis.speak(lastReply?.text)}
          disabled={!speechSynthesis.isSupported || !lastReply?.text}
          aria-label={speechSynthesis.isSpeaking ? '停止播报' : '播放回复'}
          title={speechSynthesis.isSpeaking ? '停止播报' : '播放回复'}
        >
          {speechSynthesis.isSpeaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </div>

      <VoiceSettings
        settings={speechSynthesis.settings}
        voices={speechSynthesis.voices}
        onChange={speechSynthesis.updateSettings}
      />
    </section>
  )
}

export default VoiceCallPanel
