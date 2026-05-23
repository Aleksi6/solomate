# SoloMate Codex Development Rules

## Project Positioning

SoloMate is an AI travel companion app for solo travelers. It is not a generic travel guide generator. The MVP must focus on this flow:

Open app → choose persona → text/voice input → AI reply → mock nearby place recommendation → photo upload → AI photo analysis → task/badge unlock → travel diary generation.

## Development Priority

P0:
- Home
- Persona selection
- Text/voice input
- AI reply
- Mock place recommendation
- Photo upload
- Photo analysis
- Task completion and badge return
- Travel diary generation
- Stable 3-minute demo flow

Do not implement as P0:
- Real complex map navigation
- Real AR game
- Full real-time video understanding
- Multi-user social matching
- Database-dependent user system

## Directory Structure

Use this project structure as the source of truth:

solomate/
├─ frontend/
├─ backend/
├─ config/
└─ docs/

Backend uses Node.js, so use .js files while preserving the structure from the source documents.

## Member A Responsibility

Member A owns:
- backend service
- /api/chat
- /api/analyze-photo
- /api/mock-places
- /api/complete-task
- /api/generate-diary
- LLM service
- vision service
- task/badge logic
- fallback
- prompt design
- deployment stability

## API Contract Rules

Do not rename response fields.

POST /api/chat must return:

{
  "reply_text": "",
  "reply_type": "",
  "emotion_detected": "",
  "suggested_action": "",
  "safety_tip": "",
  "next_options": [],
  "task_triggered": ""
}

POST /api/analyze-photo must return:

{
  "scene_summary": "",
  "safety_observation": "",
  "photo_advice": "",
  "task_result": {
    "passed": true,
    "reward_badge": "",
    "reason": ""
  },
  "reply_text": ""
}

POST /api/generate-diary must return:

{
  "diary": "",
  "share_caption": "",
  "summary_tags": []
}

## Stability Rules

Every core feature must have fallback:
- LLM failure → fixed companion reply
- Vision failure → mock photo analysis
- Voice failure → text input still works
- TTS failure → show text only
- Location failure → use mock location
- JSON parse failure → normalize to standard fields

## Collaboration Rules

- Do not modify frontend unless explicitly asked.
- Do not change config field names without updating docs/api_contract.md.
- personas.json and tasks.json are mainly designed by Member B, but backend must read them.
- All APIs must work with mock data before real model integration.