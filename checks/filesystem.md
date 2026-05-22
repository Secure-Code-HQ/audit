# Filesystem Checks

Checks for exposed secrets, misconfigured file permissions, and sensitive data leaking through version control or running processes.

**Condition**: Always runs.

---

## env-in-git

**Impact**: High

**What it checks**: Whether any `.env` files are tracked by git inside repositories on the server.

**Commands executed on your server**:
```
find / -maxdepth 6 -name .git -type d -execdir git ls-files --error-unmatch .env ; -printf '%h/.env\n'
```

If no tracked `.env` files are found, reports an empty array.

**Why it matters**: `.env` files contain database credentials, API keys, and secret tokens. If tracked by git and the repository was ever public (even briefly), those credentials are permanently compromised in git history and cannot be retroactively removed.

**Data sent**: `filesystem.env_files_in_git` - value: array of file paths (e.g., `["/var/www/myapp/.env"]`). Only paths are sent, never file contents.

---

## env-files-found

**Impact**: Info | **Plan**: Paid

**What it checks**: All `.env` files present on the server.

**Commands executed on your server**:
```
find / -maxdepth 6 -name .env -type f
```

Fallback:
```
find /home /var /srv /opt /root -maxdepth 4 -name .env -type f
```

If no `.env` files are found, reports an empty array.

**Why it matters**: Knowing which `.env` files exist on the server provides context for the other filesystem checks. An unexpected `.env` file may indicate a forgotten deployment or test environment.

**Data sent**: `filesystem.env_files_found` - value: array of file paths

---

## env-permissions

**Impact**: Medium | **Plan**: Paid

**What it checks**: Whether `.env` files have world-readable permissions (readable by any user on the system).

**Commands executed on your server**:
```
find / -maxdepth 6 -name .env -type f -exec stat -c '%a %n' {} +
```

If no `.env` files are found, reports an empty array.

**Why it matters**: If a `.env` file is readable by all users, any compromised service or user account on the server can read database passwords and API keys from other applications.

**Data sent**: `filesystem.env_files_world_readable` - value: array of permission and path strings (e.g., `["644 /var/www/app/.env"]`)

---

## env-in-processes

**Impact**: High | **Plan**: Paid

**What it checks**: Whether sensitive environment variables are visible in running processes via `/proc/*/environ`.

**Commands executed on your server**:
```
find /proc -maxdepth 2 -name environ -exec cat {} + | tr '\0' '\n' | grep -E '^(DATABASE_URL|SECRET|PASSWORD|API_KEY|TOKEN)=' | cut -d= -f1 | sort -u | head -20
```

If no sensitive variables are found, reports an empty array.

**Why it matters**: Some applications pass secrets as environment variables that are visible to any user with access to `/proc`. This exposes credential names to anyone with shell access to the server.

**Data sent**: `processes.env_vars_exposed_in_ps` - value: array of variable names only (e.g., `["DATABASE_URL", "SECRET"]`). Values are never captured or sent.
