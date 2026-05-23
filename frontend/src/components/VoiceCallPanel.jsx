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

  const statusText = (() => {
    if (!speechRecognition.isSupported) return '当前浏览器不支持语音识别，可继续用文字输入'
    if (speechRecognition.error) return '识别失败，可重试或使用文字输入'
    if (isSending) return '正在等待 AI 回复'
    if (speechRecognition.isListening) return '正在听你说话'
    if (speechRecognition.transcript) return speechRecognition.transcript
    return '点击麦克风开始一轮语音对话'
  })()

  return (
    <section className="voice-call-panel" aria-label="语音通话面板">
      <div className="voice-call-main">
        <div className="voice-avatar" aria-hidden="true">
          {persona?.avatar}
        </div>
        <div className="voice-call-copy">
          <p className="eyebrow">拟语音通话</p>
          <h2>{persona?.name || 'SoloMate'}</h2>
          <p>{statusText}</p>
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
          className="round-control"
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
