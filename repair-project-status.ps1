# repair-project-status.ps1
# Sets Status = "Todo" on every item already in the project board.
# Run this ONCE after setup-project-board.ps1 created the project.

$OWNER = "SDivya03"

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

# ── 1. Find the project ──────────────────────────────────────────────────────
Write-Host "Finding project..." -ForegroundColor Cyan
$r = gql 'query($login: String!) {
  user(login: $login) {
    projectsV2(first: 20) {
      nodes { id number title }
    }
  }
}' @{ login = $OWNER }

# Force array so Where-Object works even with a single result
$allProjects = @($r.data.user.projectsV2.nodes)
Write-Host "Projects found: $($allProjects.Count)" -ForegroundColor Gray
$allProjects | ForEach-Object { Write-Host "  #$($_.number) - $($_.title)" -ForegroundColor Gray }

$project = $allProjects | Where-Object { $_.title -like "*Clinique*" } | Select-Object -First 1
if (-not $project) {
    Write-Host "No Clinique project found." -ForegroundColor Red
    exit 1
}
$projectId = $project.id
if (-not $projectId) {
    Write-Host "Project found but ID is empty. Raw: $($project | ConvertTo-Json)" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $($project.title) (ID: $projectId)" -ForegroundColor Green

# ── 2. Get Status field and its Todo option ID ───────────────────────────────
Write-Host "Reading Status field..." -ForegroundColor Cyan
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

$statusField   = $r.data.node.fields.nodes | Where-Object { $_.name -eq "Status" }
$statusFieldId = $statusField.id
$todoOptionId  = ($statusField.options | Where-Object { $_.name -eq "Todo" }).id
Write-Host "Status field ready. Todo option: $todoOptionId" -ForegroundColor Green

# ── 3. Get all items in the project ─────────────────────────────────────────
Write-Host "Fetching project items..." -ForegroundColor Cyan
$r = gql 'query($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      items(first: 100) {
        nodes { id }
      }
    }
  }
}' @{ id = $projectId }

$items = $r.data.node.items.nodes
Write-Host "Found $($items.Count) items" -ForegroundColor Green

# ── 4. Set Status = Todo on every item ──────────────────────────────────────
Write-Host "Setting Status = Todo on all items..." -ForegroundColor Cyan
foreach ($item in $items) {
    gql 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId:    $itemId
        fieldId:   $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' @{
        projectId = $projectId
        itemId    = $item.id
        fieldId   = $statusFieldId
        optionId  = $todoOptionId
    } | Out-Null
    Write-Host "  Updated item $($item.id.Substring(0,12))..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done! All items are now in the Todo column." -ForegroundColor Green
Write-Host "Refresh your project board to see them." -ForegroundColor Yellow
