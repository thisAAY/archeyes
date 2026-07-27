# Security Policy

## Reporting a vulnerability

Please **don't** open a public issue for security problems. Instead, report privately via
GitHub's [security advisories](https://github.com/thisAAY/archeyes/security/advisories/new)
for this repo. You'll get a response as soon as possible.

## Scope

ArchEyes is a **local-only** developer tool. The `archeyes review` server:

- binds `127.0.0.1` on a random port,
- requires a per-session token in the URL, and
- validates the `Host`/`Origin` header on every request (DNS-rebinding guard).

Nothing is sent off your machine; there is no cloud component and no account.

Things worth reporting: a way for a remote page or another origin to reach the local
server, feedback/graph parsing that could execute or exfiltrate, or a supply-chain issue
in the published npm package.

## Supported versions

The latest published `0.x` release on npm is supported. ArchEyes is pre-1.0; fixes land on
the latest version.
