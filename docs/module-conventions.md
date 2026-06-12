# Module conventions

How code is organised in this project. Applies to everything under `src/modules/`.
See the live migration in [restructure-by-component](../.project/tasks/task-002_restructure-by-component.md).

## 1. Modules are by purpose, not by tech layer

Code is grouped by *what it's for* (`reader`, `content`, `translation`, `vocab-store`,
`session-history`), not by *what kind of file it is* (no top-level `components/`, `utils/`,
`types/`). Each purpose is a folder under `src/modules/<component>/`.

`src/app/` stays where Next.js requires it, but is kept thin — pages compose modules,
API routes delegate to them. No business logic in `app/`.

## 2. Every module has a public API (`index.ts`)

The module's `index.ts` is its only front door. Other modules import **from the folder**:

```ts
import { fetchRichTranslation } from '@/modules/translation';        // ✅
import { translateWord } from '@/modules/translation/services/...';  // ❌ reaching inside
```

Anything not re-exported from `index.ts` is private to the module and can be refactored
freely. Cross-module access goes through these barrels only — that *is* the boundary.

## 3. Inside a module, group by role

| File / folder | Holds |
|---|---|
| `index.ts`     | public API (barrel) — always present |
| `components/`  | React UI (`.tsx`) |
| `services/`    | logic & orchestration ("what we do") |
| `storage.ts`   | persistence ("where it lives") — its own layer, see §4 |
| `config.ts`    | module constants / config |
| `types.ts`     | the module's types |
| `<sub>/`       | a genuine internal sub-module (e.g. `translation/wiktionary/`) |

**Rule of thumb — subfolder at 2+ files.** Make a `components/` (etc.) folder only once a
module has 2+ files of that role. A single file stays flat (`storage.ts`, not
`storage/index.ts`). Keeps small modules simple, gives big ones room to grow.

## 4. Storage is its own layer, not part of `services/`

Persistence is a separate concern from logic, and the dependency runs one way: a service
may call storage; storage never imports a service.

This matters here specifically: storage is the thing we've already decided to swap —
vocab + knowledge move from localStorage to a Google Sheet
([decision 001](../.project/decisions/001-storage-google-sheet.md)), and the test mechanism
must be pluggable ([decision 002](../.project/decisions/002-testing-custom-quiz.md)). Keeping
storage isolated and named means the swap replaces `storage.ts` without touching the
services above it.

## 5. Third-party tools sit behind a port (interface) + adapter

Every external dependency is reached through a module-internal interface ("port"), with a
concrete implementation ("adapter") behind it. The orchestrator depends on the interface,
not on the vendor. This is what makes a provider switchable.

Keep it lightweight: **one interface + one adapter each** — no provider registry / plugin
system until something actually needs it.

Current and planned ports:

| Port | What it does | Adapter today | Could become |
|---|---|---|---|
| `Translator` | `translate(word, from, to)` → string | MyMemory | Google, DeepL |
| `Dictionary` | `lookup(word)` → lemma, part of speech, definitions | Wiktionary | other lexical API |
| `ContentSource` | provide reading content | local files (`fs` + gray-matter) | remote, AI-generated |
| `VocabRepository` | persist vocab + knowledge | localStorage | Google Sheet |

**Translator vs Dictionary are different ports, not one.** A translator says what a word
*means* in another language (Finnish → English). A dictionary (Wiktionary) describes the
word in its own language — its lemma (base form, `juoksen` → `juosta`), part of speech,
definitions, grammar. `RichTranslation` is built from both. They answer different questions,
so they get different interfaces.
