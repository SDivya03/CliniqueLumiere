# setup-project-board.ps1
# Run from PowerShell in C:\Repositories\CliniqueLumiere
# Requires: gh CLI logged in with 'project' scope

$OWNER = "SDivya03"
$REPO  = "CliniqueLumiere"

# Helper — pipes a JSON body into gh api graphql --input to avoid quoting issues
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

# ── 1. Get owner node ID ─────────────────────────────────────────────────────
Write-Host "Getting owner ID..." -ForegroundColor Cyan
$r = gql 'query($login: String!) { user(login: $login) { id } }' `
         @{ login = $OWNER }
$ownerId = $r.data.user.id

# ── 2. Create project ────────────────────────────────────────────────────────
Write-Host "Creating GitHub Project..." -ForegroundColor Cyan
$r = gql 'mutation($ownerId: ID!, $title: String!) {
  createProjectV2(input: { ownerId: $ownerId, title: $title }) {
    projectV2 { id number url }
  }
}' @{ ownerId = $ownerId; title = "Clinique Lumiere Sprint Board" }

$projectId  = $r.data.createProjectV2.projectV2.id
$projectUrl = $r.data.createProjectV2.projectV2.url
Write-Host "Created: $projectUrl" -ForegroundColor Green

# ── 3. Read the default Status field ────────────────────────────────────────
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

# ── 4. (Status column rename skipped — do it in the UI after the script runs)
# In the project board: Settings → Fields → Status → rename "Done" to "Test"

# ── 5. Create Sprint single-select field ────────────────────────────────────
Write-Host "Creating Sprint field..." -ForegroundColor Cyan
$r = gql 'mutation($projectId: ID!) {
  createProjectV2Field(input: {
    projectId: $projectId
    dataType:  SINGLE_SELECT
    name:      "Sprint"
    singleSelectOptions: [
      { name: "Sprint 1", color: PURPLE, description: "Patient Intake" }
      { name: "Sprint 2", color: GREEN,  description: "Appointments and Staff Dashboard" }
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField { id name options { id name } }
    }
  }
}' @{ projectId = $projectId }

$sprintFieldId   = $r.data.createProjectV2Field.projectV2Field.id
$sprint1OptionId = ($r.data.createProjectV2Field.projectV2Field.options | Where-Object { $_.name -eq "Sprint 1" }).id
$sprint2OptionId = ($r.data.createProjectV2Field.projectV2Field.options | Where-Object { $_.name -eq "Sprint 2" }).id

# ── 6. Helper — add one issue and set Sprint + Status ───────────────────────
function Add-Issue {
    param([int]$Number, [string]$SprintId)

    $issue      = gh api "repos/$OWNER/$REPO/issues/$Number" | ConvertFrom-Json
    $issueNodeId = $issue.node_id

    # Add to project
    $r = gql 'mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }' @{ projectId = $projectId; contentId = $issueNodeId }
    $itemId = $r.data.addProjectV2ItemById.item.id

    # Set Sprint
    gql 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId:    $itemId
        fieldId:   $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' @{ projectId = $projectId; itemId = $itemId; fieldId = $sprintFieldId; optionId = $SprintId } | Out-Null

    # Set Status = Todo
    gql 'mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId:    $itemId
        fieldId:   $fieldId
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }' @{ projectId = $projectId; itemId = $itemId; fieldId = $statusFieldId; optionId = $todoOptionId } | Out-Null

    Write-Host "  #$Number added" -ForegroundColor Gray
}

# ── 7. Add issues to their sprints ──────────────────────────────────────────
Write-Host "Adding Sprint 1 issues (#1-7)..." -ForegroundColor Cyan
1..7  | ForEach-Object { Add-Issue -Number $_ -SprintId $sprint1OptionId }

Write-Host "Adding Sprint 2 issues (#8-18)..." -ForegroundColor Cyan
8..18 | ForEach-Object { Add-Issue -Number $_ -SprintId $sprint2OptionId }

# ── 8. Link project to the repo ─────────────────────────────────────────────
Write-Host "Linking project to repository..." -ForegroundColor Cyan
$repo   = gh api "repos/$OWNER/$REPO" | ConvertFrom-Json
$repoId = $repo.node_id
gql 'mutation($projectId: ID!, $repositoryId: ID!) {
  linkProjectV2ToRepository(input: { projectId: $projectId, repositoryId: $repositoryId }) {
    repository { name }
  }
}' @{ projectId = $projectId; repositoryId = $repoId } | Out-Null

Write-Host ""
Write-Host "Done! Open your board:" -ForegroundColor Green
Write-Host $projectUrl -ForegroundColor Yellow
