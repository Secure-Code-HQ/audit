# What We Collect

## What we DO

The CLI agent reads the following from your server:

- **SSH configuration**: whether root login is enabled, which port SSH uses, whether password auth is enabled, count of authorized keys
- **Firewall state**: which ports are listening via `ss` or `netstat`
- **File system state**: whether `.env` files are tracked by git (paths only, never contents), file permissions, list of `.env` files present
- **System state**: whether fail2ban is installed and running, count of pending security updates, users with sudo access, disk usage percentage, SSL certificate expiration dates, swap status
- **Docker configuration**: running container IDs and names, port mappings, whether Docker API port (2375) is listening
- **Database binding**: whether PostgreSQL (5432), Redis, or MongoDB (27017) listen on network interfaces (only if installed)
- **Authentication logs**: count of failed login attempts, IP addresses with most failures, whether an attack is in progress
- **Server identity**: operating system, kernel version, public IP address, uptime, installed software versions
- **Process visibility**: names of sensitive environment variables visible in `/proc/*/environ` (variable names only, never values)

The complete list of fields: [what-we-send.md](../collector/what-we-send.md)
The exact JSON format: [payload.schema.json](../collector/payload.schema.json)

## What we DO NOT

The CLI agent never:

- **Reads the contents of any file**: we check paths, permissions, and git tracking status. We never open or read file data.
- **Reads .env file values**: we detect that `/var/www/myapp/.env` exists in git. We never read what is inside it.
- **Captures environment variable values**: we detect that `DATABASE_URL` is set in a process environment. We capture only the variable name, never the value (`cut -d= -f1`).
- **Accesses SSH keys or private keys**: we do not read `~/.ssh/id_rsa`, server certificates, or any private key material.
- **Stores passwords or password hashes**: we check whether password authentication is enabled in SSH config, not what any password is.
- **Reads database contents**: we check whether a database port is listening on network interfaces. We never connect to, query, or read data from any database.
- **Opens inbound connections**: we never listen on any port. The agent only makes outbound HTTPS requests.
- **Installs persistent software**: no daemons, no cron jobs, no services, no packages. The agent file is deleted after execution.
- **Runs in the background**: the agent runs in the foreground of your terminal and exits when complete.
- **Shares raw data with third parties**: your audit data is used only to generate your security report.

## Why secrets are not captured

The commands themselves are designed to never read secrets:

- SSH checks read `sshd_config` settings (`PermitRootLogin`, `Port`), not keys or passwords
- Filesystem checks detect whether `.env` files exist in git (`git ls-files`), never open them
- Database checks test whether a port is listening (`ss -tlnp`), never connect or query
- Process checks read `/proc/*/environ` but pipe through `cut -d= -f1` to capture only variable names, never values
- Raw command output is truncated to 500 characters before inclusion in the payload
- The validation layer scans for sensitive field names (`password`, `secret`, `private_key`, `api_key`, `credential`) and strips any that are not in the audit contract

The backend controls which commands the agent executes. You can verify every command in [checks/](../checks/) and inspect the exact payload with `--dry-run` before sending anything.

This is visible in [cli/src/core/step-executor.ts](../cli/src/core/step-executor.ts) (step execution) and [cli/src/core/validation.ts](../cli/src/core/validation.ts) (contract validation and sensitive field stripping). You can verify this in the source code.

## Data retention

- Your audit results are stored in your dashboard, accessible only to you
- Raw command output is truncated to 500 characters per check
- You can delete your reports at any time from your dashboard
- No audit data is used for model training or shared externally

## Verification

Run the audit with `--dry-run` to see the exact payload without sending anything:

```bash
curl -sSL https://audit.securecodehq.com/run/YOUR_TOKEN | bash -s -- --dry-run
```

The output is the complete JSON that would be transmitted. Compare it with our [documented example](../collector/payload-example.json).
