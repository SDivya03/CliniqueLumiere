# /work-tickets

Fan out Claude agents to implement GitHub issues in parallel. Each agent gets an isolated git worktree, creates a feature branch, implements the ticket, and opens a PR.

## When to invoke

Use this skill when the user types any of:
- `/work-tickets`
- `work on tickets`
- `implement tickets`
- `work on issues`
- `pick up tickets`
- `run agents on tickets`

## Usage

```
/work-tickets                   ← auto-pick up to 3 unassigned open tickets
/work-tickets 5                 ← auto-pick up to 5 unassigned open tickets
/work-tickets #9 #12 #15        ← implement specific issue numbers
/work-tickets --label story     ← filter to issues with label "story"
```

## How to invoke

Parse the user's arguments, then call the `Workflow` tool:

```js
// No args → pick 3 unassigned
Workflow({ name: 'work-tickets' })

// Limit
Workflow({ name: 'work-tickets', args: { limit: 5 } })

// Specific issues
Workflow({ name: 'work-tickets', args: { numbers: [9, 12, 15] } })

// Label filter
Workflow({ name: 'work-tickets', args: { label: 'story' } })

// Combined
Workflow({ name: 'work-tickets', args: { label: 'appointments', limit: 4 } })
```

## What the workflow does

```
Fetch          →  gh issue list (open, unassigned)
               ↓
Implement      →  parallel agents (one per ticket)
               │     • reads CLAUDE.md + existing code
               │     • creates feature/CL-<N>-<slug> branch  (worktree-isolated)
               │     • implements all acceptance criteria
               │     • writes Jest unit tests
               │     • commits + opens PR linked to the issue
               ↓
Verify         →  confirms PR exists on GitHub
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

After the workflow completes, show the user a markdown table of PRs opened and any blockers.
