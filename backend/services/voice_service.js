async function transcribeAudioMock() {
  return {
    text: "",
    source: "mock",
    message: "MVP 阶段语音识别由前端浏览器能力完成，后端保留 mock service。"
  };
}

async function synthesizeSpeechMock(text = "") {
  return {
    audio_url: "",
    text,
    source: "mock",
    message: "MVP 阶段 TTS 由前端浏览器能力完成，后端保留 mock service。"
  };
}

module.exports = {
  transcribeAudioMock,
  synthesizeSpeechMock
};
