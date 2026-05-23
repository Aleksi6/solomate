$ErrorActionPreference = "Stop"

$baseUrl = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://localhost:3001" }
$startedProcess = $null

function Wait-ForHealth {
  param([string]$Url)

  for ($i = 0; $i -lt 20; $i++) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri "$Url/api/health" -TimeoutSec 1
      if ($health.status -eq "ok") {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  return $false
}

function Assert-Fields {
  param(
    [string]$Name,
    [object]$Object,
    [string[]]$Fields
  )

  foreach ($field in $Fields) {
    if (-not ($Object.PSObject.Properties.Name -contains $field)) {
      throw "$Name missing field: $field"
    }
  }
}

try {
  if (-not (Wait-ForHealth -Url $baseUrl)) {
    Write-Host "SoloMate backend is not running. Starting local server..."
    $serverPath = Join-Path $PSScriptRoot "..\server.js"
    $backendDir = Resolve-Path (Join-Path $PSScriptRoot "..")
    $baseUri = [System.Uri]$baseUrl
    $env:PORT = [string]$baseUri.Port
    $env:LLM_ENABLE = "false"
    $startedProcess = Start-Process -FilePath "node" -ArgumentList $serverPath -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru

    if (-not (Wait-ForHealth -Url $baseUrl)) {
      throw "Backend did not become healthy at $baseUrl"
    }
  }

  $health = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/health" -TimeoutSec 5
  Assert-Fields -Name "health" -Object $health -Fields @("status", "service", "mode")

  $places = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/mock-places" -TimeoutSec 5
  if (-not $places -or $places.Count -lt 1) {
    throw "mock-places returned empty list"
  }

  $chatPayload = @{
    user_text = "solo traveler needs next step"
    persona_id = "gentle_friend"
    mode = "decision"
    context = @{
      mood = "uncertain"
    }
  }
  $chat = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/chat" -ContentType "application/json" -Body ($chatPayload | ConvertTo-Json -Depth 8) -TimeoutSec 5
  Assert-Fields -Name "chat" -Object $chat -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")

  $photoPayload = @{
    task_id = "firework_photo_task"
    persona_id = "game_sprite"
  }
  $photo = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/analyze-photo" -ContentType "application/json" -Body ($photoPayload | ConvertTo-Json -Depth 4) -TimeoutSec 5
  Assert-Fields -Name "photo" -Object $photo -Fields @("scene_summary", "safety_observation", "photo_advice", "task_result", "reply_text")
  Assert-Fields -Name "photo.task_result" -Object $photo.task_result -Fields @("passed", "reward_badge", "reason")

  $taskPayload = @{
    task_id = "firework_photo_task"
    passed = $true
  }
  $task = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/complete-task" -ContentType "application/json" -Body ($taskPayload | ConvertTo-Json -Depth 4) -TimeoutSec 5
  Assert-Fields -Name "complete-task" -Object $task -Fields @("completed_tasks", "badges")

  $diaryPayload = @{
    visited_places = @("old street entrance", "night market")
    badges = @("city life badge")
    mood_history = @("uncertain", "relaxed")
    chat_summary = "The user felt uncertain first, then completed the photo task."
  }
  $diary = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/generate-diary" -ContentType "application/json" -Body ($diaryPayload | ConvertTo-Json -Depth 8) -TimeoutSec 5
  Assert-Fields -Name "generate-diary" -Object $diary -Fields @("diary", "share_caption", "summary_tags")

  Write-Host "SoloMate backend smoke test passed."
  Write-Host "Base URL: $baseUrl"
} finally {
  if ($startedProcess -and -not $startedProcess.HasExited) {
    Stop-Process -Id $startedProcess.Id -Force
  }
}
