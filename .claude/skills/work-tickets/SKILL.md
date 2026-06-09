---
name: work-tickets
description: Fan out parallel Claude agents to implement GitHub issues, each in an isolated git worktree — every agent reads the ticket, creates a feature branch, implements all acceptance criteria, writes tests, and opens a PR. Use this whenever the user wants to work on, implement, build, pick up, or knock out GitHub tickets/issues in parallel, run agents on the backlog, or burn down sprint work — even if they don't say "parallel" or name this skill explicitly. Trigger on phrases like "work on tickets", "implement issues #9 #12", "build out the appointments epic", or "have agents pick up the backlog".
---

# work-tickets

Fan out Claude agents to implement GitHub issues in parallel. Each agent gets an isolated git worktree, creates a feature branch, implements the ticket, writes tests, and opens a PR — so multiple tickets land simultaneously without file collisions.

## Usage

```
/work-tickets                   ← auto-pick up to 3 unassigned open tickets
/work-tickets 5                 ← auto-pick up to 5 unassigned open tickets
/work-tickets #9 #12 #15        ← implement specific issue numbers
/work-tickets --label story     ← filter to issues with label "story"
```

## How to invoke

This skill is powered by a workflow script bundled alongside it at `scripts/work-tickets.js`. Parse the user's arguments, then call the `Workflow` tool with `scriptPath` pointing at that bundled script (resolve it relative to this skill's directory):

```js
// No args → auto-pick 3 unassigned tickets
Workflow({ scriptPath: '.claude/skills/work-tickets/scripts/work-tickets.js' })

// Limit the batch size
Workflow({ scriptPath: '.claude/skills/work-tickets/scripts/work-tickets.js', args: { limit: 5 } })

// Specific issue numbers
Workflow({ scriptPath: '.claude/skills/work-tickets/scripts/work-tickets.js', args: { numbers: [9, 12, 15] } })

// Filter by label
Workflow({ scriptPath: '.claude/skills/work-tickets/scripts/work-tickets.js', args: { label: 'story' } })

// Combine label + limit
Workflow({ scriptPath: '.claude/skills/work-tickets/scripts/work-tickets.js', args: { label: 'appointments', limit: 4 } })
```

### Parsing arguments

| User types | Pass as args |
|------------|-------------|
| `/work-tickets` | *(none)* |
| `/work-tickets 5` | `{ limit: 5 }` |
| `/work-tickets #9 #12 #15` | `{ numbers: [9, 12, 15] }` |
| `/work-tickets --label appointments` | `{ label: 'appointments' }` |

## Prerequisites

Before invoking, the environment must have:
- `gh` authenticated (`gh auth status` succeeds) — agents read issues and open PRs through it.
- A git repo with a `master` base branch and at least one open issue.
- The project scaffold present (Angular app + backend). If absent, agents create only the files their ticket needs and flag it in their summary.

## What the workflow does

```
Fetch          →  gh issue list (open, prefers unassigned)
               ↓
Implement      →  parallel agents (one per ticket, worktree-isolated)
               │     • reads CLAUDE.md + existing code
               │     • creates feature/CL-<N>-<slug> branch
               │     • implements all acceptance criteria
               │     • writes Jest unit tests
               │     • commits + opens PR linked to the issue
               ↓
Verify         →  confirms each PR exists on GitHub
               ↓
Report         →  succeeded / partial / failed summary
```

## Output

The workflow returns:
```json
{
  "succeeded": [{ "ticket": "CL-2.1.2", "pr": "https://github.com/...", "branch": "feature/..." }],
  "partial":   [{ "ticket": "CL-1.3.1", "blockers": "..." }],
  "failed":    [{ "ticket": "CL-3.2.1", "blockers": "..." }],
  "total":     { "succeeded": 1, "partial": 1, "failed": 0 }
}
```

After the workflow completes, present the user a markdown table of PRs opened and any blockers.
