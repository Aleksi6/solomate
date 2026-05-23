function VoiceSettings({ settings, voices, onChange }) {
  return (
    <details className="voice-settings glass-card">
      <summary>语音设置</summary>

      <div className="voice-settings-grid">
        <label>
          <span>回答声音</span>
          <select value={settings.voiceURI} onChange={(event) => onChange({ voiceURI: event.target.value })}>
            <option value="">浏览器默认声音</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>语速 {Number(settings.rate).toFixed(1)}</span>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={settings.rate}
            onChange={(event) => onChange({ rate: event.target.value })}
          />
        </label>

        <label>
          <span>音调 {Number(settings.pitch).toFixed(1)}</span>
          <input
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={settings.pitch}
            onChange={(event) => onChange({ pitch: event.target.value })}
          />
        </label>
      </div>
    </details>
  )
}

export default VoiceSettings
