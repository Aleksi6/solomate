function getVoiceStatus() {
  return {
    browser_asr_recommended: true,
    backend_asr_enabled: false,
    tts_recommended: "browser_speech_synthesis"
  };
}

async function transcribeAudioMock() {
  return {
    text: "",
    source: "mock",
    message: "MVP 阶段推荐使用浏览器 Web Speech API 进行语音识别。"
  };
}

async function synthesizeSpeechMock(text = "") {
  return {
    audio_url: "",
    text,
    source: "mock",
    message: "MVP 阶段推荐使用浏览器 speechSynthesis 进行 TTS 播放。"
  };
}

module.exports = {
  getVoiceStatus,
  transcribeAudioMock,
  synthesizeSpeechMock
};
