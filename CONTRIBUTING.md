# Contributing

Changes from outside are welcome — the consumers of this layer find
what it is missing faster than anyone working on it. This is how one
gets in.

## The route

1. **Open an issue first** for anything bigger than a fix: a new
   component, a new prop, a token. Say what you need it for — the
   screen, the field, the data — not only what you want it to be. Most
   of the decisions in this repo were made by a concrete case, and a
   proposal with one is decided in a day.
2. **Branch from `main`**, named for what it does (`table-editable-cells`,
   `fix-datepicker-locale`). One change per branch.
3. **Run `pnpm test`** before you push. It is the same set of checks CI
   runs, and it exits non-zero on the first failure. `AGENTS.md` says
   what each check guards and why.
4. **Open a pull request** against `main`. Describe what was found and
   how — "fix slider" is not a record of anything. If it changes the
   public surface, add the entry to `CHANGELOG.md` under *Unreleased* in
   the same pull request.
5. **CI must be green.** No check is switched off or loosened to get
   there; if a check is wrong, that is its own pull request with its
   own argument.
6. **The owner approves and merges.** `.github/CODEOWNERS` requests the
   review automatically. One approval is enough; a contributor does not
   merge their own pull request.
7. **Tags are cut by the owner**, never in a pull request. A consumer
   pins a tag, so a tag is a promise, and the one who makes it is the
   one who answers for it.

## What gets a pull request turned back

- A prop added to stretch a component past what its doc comment says it
  refuses to be. Propose a new component instead — the comment at the
  top of each file says where its edges are, and why.
- A colour, a spacing or a radius as a literal value. Tokens only, and
  the semantic tier only; `AGENTS.md` has the list.
- Visible text in a template that a consumer cannot replace.
- A breaking change without a `CHANGELOG.md` entry under *Breaking*.
  `AGENTS.md` says exactly what counts.

## Licence

By contributing you agree that your contribution is licensed under the
MIT licence in `LICENSE`.
