# foods

An open, maintained food composition database as exact, tree-shakable data for
`@thereforejs/nutrition` (github.com/thereforejs/nutrition, local `~/projects/nutrition`), published as
`@thereforejs/foods` (repo `thereforejs/foods`, local folder still `~/projects/bls`). It starts from the
BLS 4.0 (Max Rubner-Institut) and grows from other open sources and contributions. Not published by
the MRI.

**`SPEC.md` is the source of truth.** Read the relevant section before touching a rule. Where the spec
is unsure it says so (section 12, open questions): never guess an answer, raise it with Flo. Decisions
in section 11 are not reopened without him.

## Non-negotiables (from the spec)

- **Every value has its source.** From a registered, openly licensed source with its entry id, or a
  lab report; never estimated by us. A replaced value names its new source; nothing changes silently.
- **Missing is not zero:** `-` becomes `null`, a real `0` stays `0` (BLS documentation 4.3).
- **Exact decimal strings:** the shortest decimal that reads back to the source double, never
  `toFixed`. Arithmetic, if ever needed, with `@thereforejs/decy`.
- **Reproducible:** the same source gives byte-identical output.
- **Tree-shakable:** no module holds a collection of all groups or all languages (SPEC 7).
- **Never guess the data.** Read the BLS documentation and quote it. When something is a reading, say
  so and let Flo decide.

## Source files

- The BLS ZIP lives in `docs/`, which is ignored and never committed, like any `HANDOFF.md`. The
  documentation PDF is linked, never redistributed. Read it with `pdftotext -layout`.
- **`data/foods/<code>.json` is the source of truth**, one file per food with its `sources`, maintained
  by hand and by contributors. Values come only from a real, openly licensed source (registered in
  `src/sources.ts`) with its entry id, or a lab report; never estimated.
- Change data only with `vp run food:new` / `vp run food:set` (`CONTRIBUTING.md`), never by hand.
  Our ids are group + `_` + six digits (`H_000001`); never invent a BLS-like code.
- `vp run import:bls` seeded `data/foods` from the BLS ZIP once. It is a tool for us and only writes
  files that do not exist; it never overwrites maintained data.
- `data/open-issues.json` lists the known contradictions (a part above its whole). The check fails on a
  new one and on a resolved one still listed (SPEC 8).
- `vp run generate` renders the ignored `src/foods/` from `data/foods`; run it after a fresh clone and
  before `vp check`. Never edit `src/foods/` by hand.
- Flo's private research notes are never referenced in the repo.
- EUR-Lex blocks scripts. For the regulation use the EU publications server
  (`curl -H "Accept: application/xhtml+xml" -H "Accept-Language: deu"
  http://publications.europa.eu/resource/celex/32011R1169`); nutrition's `docs/` holds the
  consolidated DE and EN texts of 1.4.2025.

## Language

- Code, identifiers, comments, docs, commits, GitHub: English.
- Food names verbatim in their language (German, English).
- Chat with Flo: German.

## Code rules

- Comments: few and short, senior style. The why (a BLS rule, a trap), never the what or how.
- No em dashes or en dashes anywhere. Use a plain hyphen.
- Small focused files, flat structure, every rule in exactly one place. Abstraction grows with use.
- No `any`, no `as never`, no dead guards.
- Imports from `vite-plus` / `vite-plus/test`, never from `vite` or `vitest`.
- Build scripts in TypeScript under `scripts/`, run with `vpx`.

## Working with Flo

- Small slices. Name the slice in one line, show the shape before a change across several files,
  build it, report, wait.
- One question at a time, with a concrete example and a recommendation. Never mix cases: "a value
  that cannot exist" (obviously 0) is not "a value that is unknown" (null). Decide the obvious
  yourself; never agree blindly.
- No precision debates nobody gains from. "Does the user gain anything from it?" decides.
- If something blocks you (a download, a missing file), say so instead of working around it.

## Verification (library tier)

- **Oracle first:** a red test before each rule, from the spec's cases (SPEC 9), then the code.
- **Sabotage probe** after each rule: break it on a copy, confirm a test fails, restore the copy and
  `cmp`. The formatter rewraps lines: check that the sabotage actually applied. Never undo work with
  `git checkout`, `git stash` or `git reset`.
- **Property tests** with `fast-check`; a seed that once failed stays in the suite.
- Before reporting: `vp check` and `vp test` green. Report failures with their output.

## Git

- Collaboration mode by default: never commit, push, open or merge PRs, or release. Flo owns git.
  Leave changes in the working tree and suggest a one-line commit message.
- Goal run only when a `/goal` is active or Flo says so: commit locally, small and meaningful; never
  push, never release.
- Commit messages: one line, Conventional Commits, Nuxt style, e.g. `feat(build): read one group`.
  No body, no Co-Authored-By, no trailers.
- Check the branch before the first change; on `main`, branch first.
- Releases run through uppt from conventional commits, set up like nutrition.

## Toolchain: Vite+

Vite+ (`vp`) wraps the package manager (pnpm), Vitest, Oxlint, Oxfmt and tsdown. `vp help` and
`vp <command> --help` list everything.

- `vp install` after pulling, `vp add` / `vp remove` for dependencies. Never call pnpm or npm directly.
- `vp check` (format, lint, type check), `vp test`, `vp pack` (build the library).
- Build with the local binary (`./node_modules/.bin/vp pack`): the global `vp` does not find the
  project's TypeScript 7 for the declaration files. CI uses the local one.
- `vp dlx` for one-off binaries, `vp run <script>` for package scripts that share a built-in's name.
