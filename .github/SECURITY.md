# Security policy

## Reporting a vulnerability

Please **do not** open a public issue. Use GitHub's private reporting: **Security → Report a vulnerability** on this repository
(<https://github.com/Rydozz15/workshop-platform/security/advisories/new>). Include what you found, how to reproduce it and the impact.

PromptSketch handles conversations and survey answers from participants, so reports about authentication, access to
`/api/admin/*`, data exposure or key handling are especially welcome.

## Scope and known limits

- The project has not had an independent security audit.
- The local mode (`data.json`) is meant for testing and small workshops, not for exposure to the public internet.
- Set `ADMIN_PASSWORD` in every deployment; in production the admin stays locked without it.
