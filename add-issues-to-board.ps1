# add-issues-to-board.ps1
# Fetches all open issues from SDivya03/CliniqueLumiere and adds them to the project board.
# Issues #1-7  -> Sprint 1 / Todo
# Issues #8-18 -> Sprint 2 / Todo

$OWNER = "SDivya03"
$REPO  = "CliniqueLumiere"

function gql {
    param([string]$Query, [hashtable]$Vars = @{})
    $body = @{ query = $Query }
    if ($Vars.Count -gt 0) { $body['variables'] = $Vars }
    $json = $body | ConvertTo-Json -Depth 20 -Compress
    $result = ($json | gh api graphql --input -) | ConvertFrom-Json
    if ($result.errors) {
        Write-Host "ERROR: $($result.errors[0].message)" -ForegroundColor Red
        exit 1
    }
    return $result
}

# ── 1. Find the project board ────────────────────────────────────────────────
Write-Host "Finding project board..." -ForegroundColor Cyan
$r = gql 'query($login: String!) {
  user(login: $login) {
    projectsV2(first: 20) { nodes { id number title } }
  }
}' @{ login = $OWNER }

$project = @($r.data.user.projectsV2.nodes) | Where-Object { $_.title -like "*Clinique*" } | Select-Object -First 1
if (-not $project) { Write-Host "Project not found." -ForegroundColor Red; exit 1 }
$projectId = $project.id
Write-Host "Board: $($project.title)" -ForegroundColor Green

# ── 2. Read Status and Sprint fields ────────────────────────────────────────
Write-Host "Reading board fields..." -ForegroundColor Cyan
$r = gql 'query($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField { id name options { id name } }
        }
      }
    }
  }
}' @{ id = $projectId }

$fields        = @($r.data.node.fields.nodes) | Where-Object { $_.name -ne $null }
$statusField   = $fields | Where-Object { $_.name -eq "Status" }
$sprintField   = $fields | Where-Object { $_.name -eq "Sprint" }

if (-not $statusField) { Write-Host "Status field not found." -ForegroundColor Red; exit 1 }
if (-not $sprintField)  { Write-Host "Sprint field not found."  -ForegroundColor Red; exit 1 }

$statusFieldId   = $statusField.id
$sprintFieldId   = $sprintField.id
$todoOptionId    = ($statusField.options | Where-Object { $_.name -eq "Todo" }).id
$sprint1OptionId = ($sprintField.options  | Where-Object { $_.name -eq "Sprint 1" }).id
$sprint2OptionId = ($sprintField.options  | Where-Object { $_.name -eq "Sprint 2" }).id

Write-Host "Status field : $statusFieldId (Todo=$todoOptionId)" -ForegroundColor Gray
Write-Host "Sprint field : $sprintFieldId (S1=$sprint1OptionId, S2=$sprint2OptionId)" -ForegroundColor Gray

# ── 3. Fetch all open issues from the repo ──────────────────────────────────
Write-Host "Fetching open issues from $OWNER/$REPO..." -ForegroundColor Cyan
$issues = @()
$page   = 1
do {
    $batch = gh api "repos/$OWNER/$REPO/issues?state=open&per_page=100&page=$page" | ConvertFrom-Json
    $issues += $batch
    $page++
} while ($batch.Count -eq 100)

Write-Host "Found $($issues.Count) open issues" -ForegroundColor Green

# ── 4. Add each issue to the board ──────────────────────────────────────────
foreach ($issue in $issues) {
    $num        = $issue.number
    $nodeId     = $issue.node_id
    $sprintOpt  = if ($num -le 7) { $sprint1OptionId } else { $sprint2OptionId }
    $sprintName = if ($num -le 7) { "Sprint 1" } else { "Sprint 2" }

    Write-Host "  Adding #$num ($($issue.title.Substring(0, [Math]::Min(40,$issue.title.Length))))..." -ForegroundColor Gray -NoNewline

    # Add to project (safe to call even if already added — returns existing item)
    $r = gql 'mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }' @{ projectId = $projectId; contentId = $nodeId }
    $itemId = $r.data.addProjectV2ItemById.item.id

    # Set Status = Todo
    gql 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId:    $itemId
        fieldId:   $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' @{ projectId = $projectId; itemId = $itemId; fieldId = $statusFieldId; optionId = $todoOptionId } | Out-Null

    # Set Sprint
    gql 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId:    $itemId
        fieldId:   $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' @{ projectId = $projectId; itemId = $itemId; fieldId = $sprintFieldId; optionId = $sprintOpt } | Out-Null

    Write-Host " done ($sprintName / Todo)" -ForegroundColor Green
}

Write-Host ""
Write-Host "All $($issues.Count) issues added to the board." -ForegroundColor Green
Write-Host "Refresh your project board to see them." -ForegroundColor Yellow
