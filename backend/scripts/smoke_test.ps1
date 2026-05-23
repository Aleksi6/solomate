$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3101"
$backendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverProcess = $null

$env:PORT = "3101"
$env:LLM_ENABLE = "false"
$env:VISION_ENABLE = "false"

function U {
  param([int[]]$CodePoints)

  return [string]::Concat(($CodePoints | ForEach-Object { [char]$_ }))
}

function Assert-True {
  param(
    [string]$Name,
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw "$Name assertion failed: $Message"
  }
}

function Assert-Fields {
  param(
    [string]$Name,
    [object]$Object,
    [string[]]$Fields
  )

  Assert-True -Name $Name -Condition ($null -ne $Object) -Message "response should not be null"

  foreach ($field in $Fields) {
    Assert-True -Name $Name -Condition ($Object.PSObject.Properties.Name -contains $field) -Message "missing field: $field"
  }
}

function Invoke-JsonGet {
  param([string]$Url)

  return Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
}

function Invoke-JsonPost {
  param(
    [string]$Url,
    [hashtable]$Payload,
    [int]$Depth = 8
  )

  $json = $Payload | ConvertTo-Json -Depth $Depth -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

  return Invoke-RestMethod `
    -Uri $Url `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body $bytes `
    -TimeoutSec 15
}

function Test-BackendHealth {
  try {
    $health = Invoke-JsonGet -Url "$baseUrl/api/health"
    return ($null -ne $health -and $health.status -eq "ok")
  } catch {
    return $false
  }
}

function Wait-BackendHealthy {
  param([int]$MaxAttempts = 30)

  for ($i = 0; $i -lt $MaxAttempts; $i++) {
    if (Test-BackendHealth) {
      return $true
    }

    Start-Sleep -Milliseconds 500
  }

  return $false
}

function Start-BackendIfNeeded {
  Write-Host "Starting isolated SoloMate backend for smoke test..."

  $process = Start-Process `
    -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $backendRoot `
    -PassThru `
    -WindowStyle Hidden

  if (-not (Wait-BackendHealthy -MaxAttempts 30)) {
    if ($process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id -Force
    }

    throw "Backend did not become healthy at $baseUrl"
  }

  return $process
}

function Stop-BackendIfStarted {
  param([object]$Process)

  if ($Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force
  }
}

$helloText = U @(0x4F60, 0x597D)
$westLakeNear = U @(0x897F, 0x6E56, 0x9644, 0x8FD1)
$locationQuestion = U @(0x4F60, 0x600E, 0x4E48, 0x77E5, 0x9053, 0x6211, 0x5728, 0x676D, 0x5DDE, 0x897F, 0x6E56, 0x7684, 0xFF0C, 0x4F60, 0x6709, 0x6211, 0x5B9A, 0x4F4D, 0x5417)
$userAtWestLake = U @(0x6211, 0x5728, 0x897F, 0x6E56, 0x9644, 0x8FD1)

$starRiverPark = U @(0x661F, 0x6CB3, 0x516C, 0x56ED)
$oldBookstore = U @(0x65E7, 0x4E66, 0x5E97)
$seaside = U @(0x6D77, 0x8FB9)
$bund = U @(0x5916, 0x6EE9)
$chongqing = U @(0x91CD, 0x5E86)
$nightMarket = U @(0x591C, 0x5E02)
$cityFireworkBadge = U @(0x57CE, 0x5E02, 0x70DF, 0x706B, 0x5FBD, 0x7AE0)

$wherePhoto = U @(0x54EA, 0x91CC, 0x597D, 0x62CD, 0x7167)
$manyPeopleAtPark = U @(0x6211, 0x60F3, 0x53BB, 0x661F, 0x6CB3, 0x516C, 0x56ED, 0xFF0C, 0x611F, 0x89C9, 0x4EBA, 0x597D, 0x591A)
$wantOldBookstore = U @(0x6211, 0x60F3, 0x53BB, 0x65E7, 0x4E66, 0x5E97)
$wantSeaside = U @(0x6211, 0x60F3, 0x53BB, 0x6D77, 0x8FB9)
$wantBundAgain = U @(0x6211, 0x53C8, 0x60F3, 0x53BB, 0x5916, 0x6EE9, 0x4E86)
$fromChongqingGo = U @(0x600E, 0x4E48, 0x4ECE, 0x91CD, 0x5E86, 0x53BB, 0x5462)
$wantNightMarket = U @(0x6211, 0x60F3, 0x53BB, 0x591C, 0x5E02)
$goOut = U @(0x6211, 0x8981, 0x51FA, 0x95E8)

$westLakeNightMarket = U @(0x897F, 0x6E56, 0x591C, 0x5E02)
$askWhereA = U @(0x4F60, 0x60F3, 0x53BB, 0x54EA)
$askWhereB = U @(0x544A, 0x8BC9, 0x6211)
$askWhereC = U @(0x53BB, 0x54EA)
$backToPrevious = U @(0x56DE, 0x5230, 0x521A, 0x624D, 0x90A3, 0x4E2A, 0x5730, 0x65B9)
$bringUmbrella = U @(0x5E26, 0x4F1E)
$rain = U @(0x96E8)

$locationNeedles = @(
  "App",
  "location",
  (U @(0x4F4D, 0x7F6E)),
  (U @(0x5B9A, 0x4F4D)),
  (U @(0x6A21, 0x62DF, 0x4F4D, 0x7F6E))
)

try {
  $serverProcess = Start-BackendIfNeeded

  $health = Invoke-JsonGet -Url "$baseUrl/api/health"
  Assert-Fields -Name "health" -Object $health -Fields @("status", "service", "mode")
  Assert-True -Name "health" -Condition ($health.status -eq "ok") -Message "status should be ok"

  $places = Invoke-JsonGet -Url "$baseUrl/api/mock-places"
  Assert-True -Name "mock-places" -Condition (@($places).Count -gt 0) -Message "mock places should not be empty"

  $greeting = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-greeting"
    user_text = $helloText
    persona_id = "gentle_friend"
    mode = "chat"
    history = @()
    conversation_state = @{
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-greeting" -Object $greeting -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")

  $locationExplain = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-location"
    user_text = $locationQuestion
    persona_id = "gentle_friend"
    mode = "chat"
    location = @{
      city = U @(0x676D, 0x5DDE)
      place_name = $westLakeNear
    }
    history = @(
      @{
        role = "user"
        text = $userAtWestLake
        timestamp = "2026-05-24T12:00:00.000Z"
        persona_id = "gentle_friend"
      }
    )
    conversation_state = @{
      current_place = $westLakeNear
      current_city = U @(0x676D, 0x5DDE)
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-location" -Object $locationExplain -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  $hasLocationExplain = $false
  foreach ($needle in $locationNeedles) {
    if ($locationExplain.reply_text.Contains($needle)) {
      $hasLocationExplain = $true
      break
    }
  }
  Assert-True -Name "chat-location" -Condition $hasLocationExplain -Message "reply should explain location source"

  $case1 = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-case-1"
    user_text = $wherePhoto
    persona_id = "gentle_friend"
    mode = "chat"
    history = @(
      @{
        role = "user"
        text = $manyPeopleAtPark
        timestamp = "2026-05-24T12:01:00.000Z"
        persona_id = "gentle_friend"
      }
    )
    conversation_state = @{
      target_place = $starRiverPark
      last_place = $starRiverPark
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-case-1" -Object $case1 -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  Assert-True -Name "chat-case-1" -Condition ($case1.reply_text.Contains($starRiverPark)) -Message "reply should continue around current target place"
  $askedDestinationAgain = $case1.reply_text.Contains($askWhereA) -or ($case1.reply_text.Contains($askWhereB) -and $case1.reply_text.Contains($askWhereC))
  Assert-True -Name "chat-case-1" -Condition (-not $askedDestinationAgain) -Message "reply should not ask destination again"

  $case2 = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-case-2"
    user_text = $wantSeaside
    persona_id = "gentle_friend"
    mode = "chat"
    history = @(
      @{
        role = "user"
        text = $wantOldBookstore
        timestamp = "2026-05-24T12:02:00.000Z"
        persona_id = "gentle_friend"
      }
    )
    conversation_state = @{
      target_place = $oldBookstore
      last_place = $oldBookstore
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-case-2" -Object $case2 -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  Assert-True -Name "chat-case-2" -Condition ($case2.reply_text.Contains($seaside)) -Message "reply should switch to the new target place"
  Assert-True -Name "chat-case-2" -Condition (-not $case2.reply_text.Contains($oldBookstore)) -Message "reply should not continue around the previous place"

  $case3 = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-case-3"
    user_text = $fromChongqingGo
    persona_id = "gentle_friend"
    mode = "chat"
    history = @(
      @{
        role = "user"
        text = $wantBundAgain
        timestamp = "2026-05-24T12:03:00.000Z"
        persona_id = "gentle_friend"
      }
    )
    conversation_state = @{
      target_place = $bund
      last_place = $bund
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-case-3" -Object $case3 -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  Assert-True -Name "chat-case-3" -Condition ($case3.reply_text.Contains($bund)) -Message "route reply should keep target place"
  Assert-True -Name "chat-case-3" -Condition ($case3.reply_text.Contains($chongqing)) -Message "route reply should mention origin place"
  Assert-True -Name "chat-case-3" -Condition (-not $case3.reply_text.Contains($backToPrevious)) -Message "route reply should not fall back to a generic previous-place answer"

  $case4 = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-case-4"
    user_text = $wantNightMarket
    persona_id = "gentle_friend"
    mode = "chat"
    location = @{
      city = U @(0x676D, 0x5DDE)
      place_name = $westLakeNear
    }
    conversation_state = @{
      travel_mode = "solo"
    }
  }
  Assert-Fields -Name "chat-case-4" -Object $case4 -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  Assert-True -Name "chat-case-4" -Condition ($case4.reply_text.Contains($nightMarket)) -Message "reply should follow the user target"
  Assert-True -Name "chat-case-4" -Condition (-not $case4.reply_text.Contains($westLakeNightMarket)) -Message "reply should not combine default location with the user target"

  $case5 = Invoke-JsonPost -Url "$baseUrl/api/chat" -Payload @{
    conversation_id = "smoke-case-5"
    user_text = $goOut
    persona_id = "gentle_friend"
    mode = "chat"
    conversation_state = @{
      travel_mode = "solo"
      live_context = @{
        local_time = "2026-05-24T19:30:00.000Z"
        time_of_day = "night"
        weather = @{
          condition = "rain"
          temperature_c = 19
          rain_probability = 80
          uv_index = 0
          source = "mock"
        }
      }
    }
    live_context = @{
      local_time = "2026-05-24T19:30:00.000Z"
      time_of_day = "night"
      weather = @{
        condition = "rain"
        temperature_c = 19
        rain_probability = 80
        uv_index = 0
        source = "mock"
      }
    }
  }
  Assert-Fields -Name "chat-case-5" -Object $case5 -Fields @("reply_text", "reply_type", "emotion_detected", "suggested_action", "safety_tip", "next_options", "task_triggered")
  $weatherHelpful = $case5.reply_text.Contains($bringUmbrella) -or $case5.reply_text.Contains($rain) -or $case5.safety_tip.Contains($bringUmbrella)
  Assert-True -Name "chat-case-5" -Condition $weatherHelpful -Message "weather reply should mention umbrella or rain"

  $photo = Invoke-JsonPost -Url "$baseUrl/api/analyze-photo" -Payload @{
    task_id = "firework_photo_task"
    persona_id = "gentle_friend"
  }
  Assert-Fields -Name "photo" -Object $photo -Fields @("scene_summary", "safety_observation", "photo_advice", "task_result", "reply_text")

  $task = Invoke-JsonPost -Url "$baseUrl/api/complete-task" -Payload @{
    task_id = "firework_photo_task"
    passed = $true
  }
  Assert-Fields -Name "complete-task" -Object $task -Fields @("completed_tasks", "badges")

  $diary = Invoke-JsonPost -Url "$baseUrl/api/generate-diary" -Payload @{
    visited_places = @($nightMarket)
    badges = @($cityFireworkBadge)
    mood_history = @("uncertain", "relaxed")
    chat_summary = "SoloMate smoke test summary."
  }
  Assert-Fields -Name "diary" -Object $diary -Fields @("diary", "share_caption", "summary_tags")

  Write-Host "SoloMate backend smoke test passed."
  Write-Host "Base URL: $baseUrl"
} finally {
  Stop-BackendIfStarted -Process $serverProcess
}
