# What We Send

This is exactly what leaves your server when you run the audit. Nothing more.

The full machine-readable schema: [payload.schema.json](payload.schema.json)
A complete anonymized example: [payload-example.json](payload-example.json)

---

## Metadata (always sent)

| Field | Type | Example | Purpose |
|---|---|---|---|
| `token` | string | `tok_abc123` | Identifies your audit session |
| `plan_id` | string | `server-audit-free` | Which audit plan was executed |
| `plan_version` | string | `1.5.1` | Version of the audit plan |
| `agent_version` | string | `2.0.0` | Version of the CLI agent |
| `timestamp` | ISO 8601 | `2026-05-18T14:32:00Z` | When the audit ran |
| `dry_run` | boolean | `false` | Whether this was a test run |
| `preflight_incomplete` | boolean | `false` | Whether required fields were missing from check results |

## Server context (always sent)

| Field | Type | Example | Purpose |
|---|---|---|---|
| `server_context.network_exposure` | string | `public` | Whether the server is public-facing or internal |
| `server_context.server_purpose` | string | `production_single` | How the server is used |
| `server_context.data_sensitivity` | string | `personal` | Type of data stored on the server |

These values are set during token creation and help the report generator prioritize findings for your specific use case.

## Server environment (always sent)

| Field | Type | Example | Purpose |
|---|---|---|---|
| `environment.os` | string | `Ubuntu 24.04 LTS` | Operating system |
| `environment.kernel` | string | `6.8.0-107-generic` | Kernel version |
| `environment.public_ip` | string or null | `203.0.113.42` | Your server's public IP |
| `environment.uptime_days` | number | `42` | Days since last reboot |
| `environment.detected_stack` | object | `{ docker: true, ... }` | What software is installed |

The detected stack only records **whether** software is installed and its version number. It does not read configuration files or access any data within those services.

## Security check results (always sent)

| Field | Type | Example | What it tells us |
|---|---|---|---|
| `results.ssh.permit_root_login` | string | `"no"` | Whether root can log in via SSH |
| `results.ssh.port` | string | `"22"` | Which port SSH listens on |
| `results.firewall.open_ports` | string[] | `["22/tcp", "80/tcp"]` | Ports open to the internet |
| `results.fail2ban.installed` | boolean | `true` | Whether fail2ban is present |
| `results.fail2ban.active` | boolean | `true` | Whether fail2ban is running |
| `results.updates.pending_security_updates` | number | `3` | Unpatched security updates |
| `results.filesystem.env_files_in_git` | string[] | `[]` | Paths of .env files tracked by git |

## Conditional results (sent only if the software is detected)

These fields are only present if the corresponding software was found during stack detection:

| Condition | Fields sent |
|---|---|
| Docker installed | `results.docker.root_containers`, `results.docker.exposed_ports`, `results.docker.api_exposed` |
| PostgreSQL installed | `results.databases.postgresql_exposed` |
| Redis installed | `results.databases.redis_auth` |
| MongoDB installed | `results.databases.mongodb_exposed` |

## Paid-only results (sent only with paid plan)

| Field | Type | What it tells us |
|---|---|---|
| `results.ssh.password_auth` | string | Whether password auth is enabled |
| `results.ssh.authorized_keys_count` | number | Count of authorized SSH keys |
| `results.filesystem.env_files_found` | string[] | All .env file paths on the system |
| `results.filesystem.env_files_world_readable` | string[] | .env files with world-readable permissions |
| `results.processes.env_vars_exposed_in_ps` | string[] | Variable names visible in /proc (names only, not values) |
| `results.system.sudo_users` | string | Users with sudo access |
| `results.system.disk_usage_percent` | string | Root partition usage |
| `results.system.swap_enabled` | boolean | Whether swap is active |
| `results.ssl.certificates` | string[] | Certificate expiry info |
| `results.logs.failed_login_attempts_24h` | number | Failed SSH login count |
| `results.logs.top_attacking_ips` | string[] | Top 10 attacking IPs by attempt count |
| `results.logs.active_attack_detected` | boolean | Whether a brute force attack is active |

## Step execution details (always sent)

For every check executed, we send execution metadata:

| Field | Type | Purpose |
|---|---|---|
| `step_results[].step_id` | string | Which check ran |
| `step_results[].status` | string | `success`, `failed`, or `skipped` |
| `step_results[].parsed_value` | any | The check result |
| `step_results[].raw_output` | string | First 500 characters of command output |
| `step_results[].duration_ms` | number | How long the check took |
| `step_results[].error_code` | string | If failed: `TIMEOUT`, `PERMISSION_DENIED`, or `COMMAND_NOT_FOUND` |
| `step_results[].error_message` | string | Error description if failed |
| `step_results[].retries` | array | Commands attempted before giving up |

## What is NEVER sent

The commands executed by the agent are designed to read configuration state, not secrets. The agent does not open, read, or transmit:

- Passwords or password hashes
- Private SSH or SSL keys
- API keys or service tokens
- Contents of .env files (only paths are checked via `git ls-files`, never opened)
- Environment variable values (only variable names via `cut -d= -f1`)

Additionally, raw command output is truncated to 500 characters per check. You can verify every command in [checks/](../checks/) and inspect the exact payload before sending with `--dry-run`:

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash -s -- --dry-run
```
