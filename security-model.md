# Security Model

## Architecture

Server Audit is a client-server system with a strict separation:

**Your server (the agent)**:
- Runs read-only commands via structured pipelines (execFile, no shell)
- Never writes, modifies, or installs anything
- Self-deletes the agent file after execution
- Source code: [cli/src/](cli/src/) (this repository)

**Our backend (not in this repository)**:
- Decides which checks to run (based on your plan)
- Analyzes results and generates the security report
- Stores reports in your dashboard
- Sends the report to your email

## Separation of concerns

The agent is a generic executor. It does not know what "critical" means. It does not know what a good SSH configuration looks like. It runs commands it receives and sends back raw output.

All intelligence lives in the backend:
- Which checks to run: decided by the backend
- How to analyze results: decided by the backend
- What to include in the report: decided by the backend
- What is important and what is informational: decided by the backend

This is by design. The CLI is intentionally minimal so that:
1. It is safe to publish (no business logic to protect)
2. It is safe to run (no decisions, no modifications)
3. It never needs updating when we improve our analysis

## Data flow

```
Your server                      Our backend
                                 
1. curl downloads install script    serves bash script
2. install script downloads         serves agent.js bundle
   agent.js to temp file              + SHA256 checksum
3. install script verifies           (integrity check)
   SHA256 hash
4. agent fetches plan               returns list of checks
   (token via Authorization           (validated with Zod schema)
    header, not URL)
5. agent validates plan              (Zod schema + command allowlist)
6. agent runs allowed checks         (no network needed)
7. agent validates payload           (Zod schema + sensitive field scan)
8. agent sends JSON result          receives payload
9. agent self-deletes                analyzes results
   (temp file removed)              generates report
                                     sends email notification
```

## Agent architecture

The agent follows a hexagonal (ports & adapters) architecture:

```
cli/src/
  cli/          Entry point, flag parsing, DI wiring
  core/         Pure business logic (no I/O, no frameworks)
    parsers/    Strategy pattern for output parsing
  ports/        Interfaces for external dependencies
  adapters/     Concrete implementations (shell, HTTP, console)
  schemas/      Zod validation schemas
```

The core never imports adapters or external libraries directly. All external dependencies (shell execution, HTTP, filesystem, validation) flow through port interfaces, injected at startup from `cli/main.ts`.

## What runs locally

**Phase 0 - Bootstrap**:
The agent fetches the audit plan from the backend via `Authorization: Bearer` header (token never in URL). The plan is validated against a Zod schema. Each command is checked against a two-layer allowlist before execution.

**Phase 1 - Stack detection** (no network after initial fetch):
Detects what software is installed using standard version commands:
`uname`, `lsb_release`, `docker --version`, `node --version`, `psql --version`, `redis-cli --version`, `podman --version`, etc.

**Phase 2 - Security checks**:
Executes each structured pipeline from the plan. Every command is documented in [checks/](checks/).
Each pipeline is an array of `{ program, args }` objects executed via `execFile` (no shell interpolation, no injection surface). Multi-command pipelines are connected via in-process piping.
Each check has a per-step timeout (5-30 seconds). The entire phase has a 5-minute timeout.
Every command is validated against a multi-layer allowlist:
1. Program name must be in `ALLOWED_PROGRAMS` (76 vetted read-only utilities). Runtime interpreters (`node`, `python`, `ruby`, `php`) and DNS tools (`dig`, `nslookup`) are explicitly excluded
2. Argument patterns that enable data exfiltration (`curl POST`, `wget --post-data`) or system mutation (`systemctl start/stop`, `apt install`) are blocked
3. `find -exec/-execdir` is restricted to executing only programs that are themselves in the allowlist; `find -delete` is blocked entirely
4. `git` is restricted to read-only subcommands (`ls-files`, `--version`); `clone`, `pull`, `push`, `hook` are blocked
5. `openssl` is restricted to `x509` and `version`; `s_client`, `req`, `genrsa` are blocked
6. `curl` is restricted to a whitelist of IP detection hosts; all other URLs are blocked

If a pipeline fails, fallback pipelines are tried in order. If all fail, the check is marked as `failed` with an error code.

**Phase 3 - Validation**:
Checks that all required fields are present in the payload using the contract received from the backend. Scans all result keys for sensitive field names (`password`, `secret`, `private_key`, `api_key`, `credential`) and strips any that are not explicitly declared in the audit contract. Validates the payload structure with Zod schema before transmission. If required fields are missing (e.g., a check failed), the agent marks the payload as `preflight_incomplete` and sends it anyway so the backend can generate a partial report. This is visible in [cli/src/core/run-audit.ts](cli/src/core/run-audit.ts).

**Phase 4 - Submission**:
Sends a single HTTPS POST request with the JSON payload.
If `--dry-run` is used, prints the payload to stdout and exits without sending.
After submission (or dry-run), the agent file is deleted.

## What we never do

- **Access your server via SSH**: we have no credentials and open no inbound connections
- **Read file contents**: we check existence, paths, and permissions, never the data inside files
- **Read .env values**: we detect whether `.env` files exist in git repos, we never read their contents
- **Capture environment variable values**: we detect variable names (`DATABASE_URL`, `SECRET`) but pipe through `cut -d= -f1` to strip values before inclusion
- **Install persistent agents**: the CLI runs once and self-deletes, no cron jobs, no daemons, no services
- **Run background processes**: the agent runs in the foreground and exits when done
- **Store raw command output**: only the first 500 characters of each command's output are included in the payload
- **Collect passwords, keys, or tokens**: the commands sent by the backend are designed to check configuration state (e.g., "is root login enabled?"), not to read secrets

## Threat model

| Threat | Mitigation |
|---|---|
| Agent is malicious | Source code is public and auditable in this repository |
| Agent captures secrets | Commands are designed to read configuration state, not secrets. Sensitive field names are scanned and stripped. Raw output truncated to 500 chars. Verify with `--dry-run` |
| Man-in-the-middle on download | HTTPS for all downloads. SHA256 integrity check is mandatory: install.sh aborts if the server does not provide a hash or if no hash tool is available |
| Man-in-the-middle on API | All communication uses HTTPS. Token sent via Authorization header, never in URL |
| Backend is compromised | Agent validates plan with Zod schema. Command allowlist blocks dangerous operations. Runtime interpreters and DNS tools excluded. `find -exec`, `git`, and `openssl` restricted to safe subcommands. Data exfiltration patterns blocked |
| Token is stolen | Tokens are bound to a single IP on first use and are time-limited |
| Token leaked in logs | Token sent via Authorization header (not URL query param). Masked in debug output |
| Modified agent is used | SHA256 integrity check before execution (mandatory, aborts on missing hash). Backend validates agent version. install.sh fails explicitly if no hash tool is available |
| Agent hangs or crashes | Per-check timeout (5-30s), 5-minute global timeout, self-cleanup on all exit paths (`finally` block) and via `trap` in install.sh |

## Dry run

You can verify everything before sending any data:

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash -s -- --dry-run
```

This executes all checks locally and prints the exact JSON that would be sent to stdout. Nothing is transmitted. Compare the output with our [documented payload schema](collector/payload.schema.json) and [example](collector/payload-example.json).
