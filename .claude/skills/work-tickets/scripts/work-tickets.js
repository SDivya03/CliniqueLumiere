export const meta = {
  name: 'work-tickets',
  description: 'Fan out parallel agents to implement GitHub issues, each in an isolated git worktree',
  phases: [
    { title: 'Fetch',     detail: 'Load open issues from GitHub' },
    { title: 'Implement', detail: 'One agent per ticket in an isolated worktree' },
    { title: 'Report',    detail: 'Summarize PRs opened and any failures' },
  ],
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPO         = 'SDivya03/CliniqueLumiere'
const BASE_BRANCH  = 'master'
const DEFAULT_BATCH = 3   // tickets to process when no explicit list given

// Structured output every implement agent must return
const RESULT_SCHEMA = {
  type: 'object',
  required: ['ticketId', 'status', 'summary'],
  properties: {
    ticketId:   { type: 'string',  description: 'e.g. CL-1.1.1 or "#9"' },
    branchName: { type: 'string',  description: 'git branch created' },
    prUrl:      { type: 'string',  description: 'GitHub PR URL, empty if not opened' },
    status: {
      type: 'string',
      enum: ['success', 'partial', 'failed'],
      description: 'success=PR opened, partial=code done no PR, failed=nothing done',
    },
    summary:  { type: 'string', description: 'One-paragraph description of what was done' },
    blockers: { type: 'string', description: 'What blocked completion, empty on success' },
  },
}

// ─── Phase 1: Fetch issues from GitHub ────────────────────────────────────────

phase('Fetch')

const raw = await agent(
  `Run exactly this command and return the raw JSON output only — no commentary:
gh issue list --repo ${REPO} --state open --limit 50 --json number,title,body,labels,assignees,milestone`,
  { label: 'gh-fetch-issues' }
)

let allIssues = []
try {
  const m = raw.match(/\[[\s\S]*\]/)
  if (m) allIssues = JSON.parse(m[0])
} catch {
  log('ERROR: could not parse GitHub issue list. Aborting.')
  return { error: 'parse_failed', raw }
}

if (!allIssues.length) {
  log('No open issues found in the repo.')
  return { prs: [], skipped: 0 }
}

// args.numbers = [9, 12] picks specific issues
// args.limit   = 5       caps the batch size
// args.label   = 'story' filters by label
let batch = allIssues

if (args?.numbers?.length) {
  batch = allIssues.filter(i => args.numbers.includes(i.number))
  log(`Targeting specific issues: ${batch.map(i => '#' + i.number).join(', ')}`)
} else {
  if (args?.label) {
    batch = batch.filter(i => i.labels?.some(l => l.name === args.label))
  }
  // Prefer unassigned tickets
  const unassigned = batch.filter(i => !i.assignees?.length)
  batch = (unassigned.length ? unassigned : batch).slice(0, args?.limit ?? DEFAULT_BATCH)
  log(`Auto-selected ${batch.length} ticket(s): ${batch.map(i => '#' + i.number).join(', ')}`)
}

if (!batch.length) {
  log('No matching tickets after filtering.')
  return { prs: [], skipped: allIssues.length }
}

// ─── Phase 2: Implement in parallel (one worktree per ticket) ─────────────────

phase('Implement')

const results = await pipeline(
  batch,

  // Stage A — implement the ticket
  (ticket) => agent(
    `You are a developer implementing GitHub issue #${ticket.number} for the Clinique Lumière clinic management system.

## Ticket
**Title:** ${ticket.title}
**Milestone / Epic:** ${ticket.milestone?.title ?? 'unset'}

## Full description
${ticket.body}

---

## How to implement

### 1  Orient yourself
- Read \`CLAUDE.md\` (project root) — it has the folder layout, Angular + Express conventions, and Definition of Done.
- Read \`PRD 1.md\` for overall context.
- Scan the existing code under \`src/app/features/\` and \`backend/routes/\` to understand what already exists.

### 2  Create your branch
\`\`\`
git checkout -b feature/CL-${ticket.number}-<2-4-word-slug>
\`\`\`
The slug must be lowercase-kebab derived from the ticket title.

### 3  Implement
Follow every acceptance criterion listed in the ticket.
Hard rules from CLAUDE.md (never break these):
- Angular 18 standalone components only (no NgModules)
- Signals (\`signal()\`, \`computed()\`, \`effect()\`) for reactive state — no BehaviorSubject
- Angular Material for all UI controls
- \`strict: true\` TypeScript — zero \`any\`, interfaces over type aliases
- Errors caught in services, exposed via signals — never caught in components
- Zero \`console.log\` in committed code
- JSDoc on every public class, method, and variable
- Folder structure: components/ · services/ · models/ · pipes/

### 4  Tests
Write Jest unit tests for each acceptance criterion. Place them next to the component/service file (\`*.spec.ts\`).

### 5  Commit
\`\`\`
git add -A
git commit -m "[CL-${ticket.number}] <short imperative description>"
\`\`\`

### 6  Open the PR
\`\`\`
gh pr create \\
  --repo ${REPO} \\
  --base ${BASE_BRANCH} \\
  --title "[CL-${ticket.number}] ${ticket.title}" \\
  --body "Closes #${ticket.number}

## What was done
<bullet list of changes>

## How to test
<bullet list matching the acceptance criteria>

🤖 Implemented by Claude agent via work-tickets workflow"
\`\`\`

### 7  Return structured output
Report your result exactly via StructuredOutput — do not just describe it in prose.

Work autonomously. Do not ask questions. If the scaffold (Angular app / Express server) does not exist yet, create only the files your ticket requires and note that in your summary.`,
    {
      label:     `implement:#${ticket.number} — ${ticket.title.slice(0, 40)}`,
      phase:     'Implement',
      isolation: 'worktree',
      schema:    RESULT_SCHEMA,
    }
  ),

  // Stage B — lightweight verify: did a PR actually appear?
  (result, ticket) => agent(
    `Verify that a pull request was opened for issue #${ticket.number} in ${REPO}.
Run: gh pr list --repo ${REPO} --state open --json number,title,headRefName,url
Check whether a PR whose title starts with "[CL-${ticket.number}]" exists.
If it does, confirm status as "success". If not, note "no_pr_found".
Return a one-sentence verdict.`,
    {
      label: `verify:#${ticket.number}`,
      phase: 'Implement',
    }
  ).then(verdict => ({ ...result, verified: verdict }))
)

// ─── Phase 3: Report ──────────────────────────────────────────────────────────

phase('Report')

const valid     = results.filter(Boolean)
const succeeded = valid.filter(r => r.status === 'success')
const partial   = valid.filter(r => r.status === 'partial')
const failed    = valid.filter(r => r.status === 'failed')

log(`Done — ${succeeded.length} PR(s) opened · ${partial.length} partial · ${failed.length} failed`)

return {
  succeeded: succeeded.map(r => ({
    ticket:  r.ticketId,
    branch:  r.branchName,
    pr:      r.prUrl,
    summary: r.summary,
  })),
  partial: partial.map(r => ({
    ticket:   r.ticketId,
    branch:   r.branchName,
    summary:  r.summary,
    blockers: r.blockers,
  })),
  failed: failed.map(r => ({
    ticket:   r.ticketId,
    summary:  r.summary,
    blockers: r.blockers,
  })),
  total: { succeeded: succeeded.length, partial: partial.length, failed: failed.length },
}
