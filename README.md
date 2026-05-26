# Server Audit CLI

Run a security audit on your Linux server in 2 minutes. One command.

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash
```
## Why this exists

Docker bypasses UFW silently. Redis runs without auth by default. 
PostgreSQL listens on 0.0.0.0 unless explicitly configured otherwise. 
SSH root login is enabled by default on most VPS providers. 

These are the misconfigurations that keep appearing on production Linux 
servers because they require active checking to detect. Your firewall 
can look healthy while your database is fully exposed.

## What it does

- Scans SSH configuration (root login, port, authentication method, authorized keys)
- Checks firewall exposure (open ports via ss/netstat)
- Detects exposed secrets (.env files tracked by git, world-readable permissions, process environment)
- Analyzes Docker misconfigurations (root containers, exposed ports, API access)
- Checks database exposure (PostgreSQL, Redis, MongoDB network binding and auth)
- Verifies system hardening (fail2ban, pending security updates, SSL certificates, swap, sudo users)
- Reviews authentication logs (failed logins, attacking IPs, active attack detection)

## What it does NOT do

- Does not install anything persistent on your server
- Does not open remote SSH connections to your server
- Does not read file contents (only checks paths and permissions)
- Does not run background processes or daemons
- Does not modify any file, configuration, or system state
- Does not store credentials, keys, or secrets
- Self-deletes after execution

## How the CLI works

The CLI does not contain security logic. It is a generic runner.

1. It asks our backend: "what should I check?" (receives a list of commands)
2. It runs those commands locally on your server (read-only)
3. It sends the raw results as JSON to our backend
4. Our backend analyzes the results and generates your report

The CLI never decides what is secure or insecure.
It never scores, ranks, or evaluates anything.
It executes commands and reports back.

## What data leaves your server

Every field transmitted is documented:

- [Human-readable explanation](collector/what-we-send.md)
- [Anonymized payload example](collector/payload-example.json)
- [Machine-readable JSON Schema](collector/payload.schema.json)

## Transparency

The source code in [cli/](cli/) is the exact code that runs on your server. Not a simplified version, not a sanitized copy. The same code, byte for byte.

Every security check is documented with the exact command executed on your server:

- [SSH checks](checks/ssh.md)
- [Firewall checks](checks/firewall.md)
- [Filesystem checks](checks/filesystem.md)
- [System checks](checks/system.md)
- [Docker checks](checks/docker.md)
- [Database checks](checks/databases.md)
- [Log analysis checks](checks/logs.md)

## Security model

How the system works, what runs where, and why it cannot harm your server:

- [Security model and threat analysis](security-model.md)
- [What we collect and what we do not](privacy/what-we-collect.md)

## Example output

See what a security report looks like before running anything:

- [Example report (free analysis)](example-output/report-free.md)

## Install

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash
```

## Dry run (no data sent)

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash -s -- --dry-run
```

This executes all checks locally and prints the full JSON payload to stdout without sending anything. Compare the output with [our documented payload](collector/payload-example.json).

## License

[MIT](LICENSE)
