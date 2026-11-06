# Contributing

Thanks for helping. A few things keep changes easy to review.

1. **Set up:** `pnpm install`, then `pnpm run local` (or `./scripts/run.sh`).
2. **Checks that must pass:** `pnpm test`, `pnpm run test:slop`, `pnpm run test:contrast`, `pnpm build`; `pnpm test:ui` if you changed a screen (needs Google Chrome).
3. **Conventions:** see [`AGENTS.md`](../AGENTS.md) (it is written for AI agents but is the shortest list of the project's rules): Spanish source text wrapped in `tr()` with English and Portuguese translations, the design rules enforced by `test:slop`, admin endpoints only under `/api/admin/*`, and pnpm as the only package manager.
4. **Pull requests:** small, one purpose each, using the template. Say whether AI tools were involved; AI-generated code is welcome if you have reviewed and tested it.
5. **Never commit** participant data, `.env*` files, `data.json` or API keys.
