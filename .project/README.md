# .project/ — how this project is run

This folder is the project's brain: a small set of plain-markdown files that take an idea
from start to done, for humans and AI together. **The files are the source of truth** — not
any chat history — so work can pause and resume across sessions, tools, and AI providers.

**New here? Read `overview.md` first.** It's the entry point — a glance at the project and
its open work. (Each artifact explains *itself* in the comments inside its file/template;
this glue only covers how the pieces fit together.)

## Pace — small steps, human-approved (AI: read this first)

The human directs; you assist. Move slowly and stay reviewable — do **not** race ahead and
scaffold the whole project at once.

- **One file at a time.** Create or change a single file, then stop. Never batch several
  goals / tasks / constraints / decisions in one turn.
- **Check before and after.** Say what you're about to write and why, get the human's okay,
  write just that one thing, then pause for review before the next file.
- **Default to draft.** A goal stays `draft` until the human promotes it to `active`; a task
  ends at `in-review` for the human to approve, not `done`.
- **Ask on forks.** When a real choice appears, surface it — don't decide silently.

## Layout

```
.project/
├── overview.md      Entry view, read first. Authored summary + Output locations,
│                    plus a derived status of goals and their open tasks.
├── constraints.md   The living list of current constraints/assumptions that bound the work.
├── goals/           One file per goal (001-slug.md): a target + how you'll know it's met.
├── tasks/           One file per task (slug.md): the work that moves a goal forward.
├── decisions/       One file per significant decision (001-slug.md): an immutable record
│                    of a hard-to-reverse choice between real alternatives.
└── templates/       Blank templates to copy when creating a new goal / task / decision.
```

`goals/` + `tasks/` are the source of truth; `overview.md` is a mostly-derived view of them.

## Conventions

- **Readable over complete** — human-facing sections (`Description`, `Goal`,
  `Success criteria`, `Context`) are bullets/fixed-fields/diagrams, not prose
  essays; skim-in-10-seconds is the bar. `Log` is the exception — it's the AI's
  free-form working trail, not optimised for human reading, so no brevity rule
  applies there.
- **Naming** — goals and decisions are numbered + slugged (`001-knowledge-search.md`);
  tasks are numbered with a `task-` prefix and underscore (`task-001_survey-existing-tools.md`).
  Titles come from filenames.
- **Links** — use `[[wikilinks]]` to connect files (a task's `goal:`, a constraint's origin,
  an output, a superseding decision).
- **Source of truth** — trust the goal/task files over the Overview; the Overview is
  regenerable from them.
- **Current focus** — the `in-progress` task(s) are "what's next." Keep few in progress at
  once (ideally one per owner).
- **Requirement vs constraint vs decision** — a desired outcome → a goal's *Success criteria*;
  a given bound → `constraints.md`; a hard-to-reverse choice between real alternatives → a
  `decisions/` record. Everything reversible or trivial stays in a task's `Log`.

## Workflow — the loop

The loop plays out over many sessions, one small step at a time (see **Pace** above) — it is
not a checklist to run in one go.

1. **Start** — dump your rough idea, refine it into the first goal (`goals/001-*.md`,
   `draft` → `active`). Put any given constraints in `constraints.md`.
2. **Plan** — break the goal into tasks (`tasks/*.md`), each linked to the goal.
3. **Do** — work a task; capture progress, minor decisions, and steering in its `Log`, and
   list what it produced in its `Outputs`. A significant decision graduates to `decisions/`.
4. **Re-evaluate** — compare the outputs to the goal's Success criteria. More work → continue
   or add tasks. Criteria met → the goal goes `achieved` and its `Outcome` is recorded. The
   goal must change → write a new goal (the old one becomes `superseded`).
5. **Resume anytime** — open `overview.md`, read the status at a glance, pick up the
   `in-progress` task. No chat history required.

## Creating a new artifact

Copy the matching template and fill it (its comments guide you, then delete them):

- New goal → `templates/goal.md` → `goals/NNN-slug.md`
- New task → `templates/task.md` → `tasks/task-NNN_slug.md`
- New decision → `templates/decision.md` → `decisions/NNN-slug.md`

`overview.md` and `constraints.md` already exist — edit them in place.

## Principles

- Minimal core; generic for any project (domain-specific needs are optional layers); file-based (no tool required); human in control (AI assists, the human directs).
- Create the files with minimum amount of text.