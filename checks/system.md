# System Checks

General system hardening: brute force protection, pending security updates, privilege management, disk usage, SSL certificate status, and swap configuration.

**Condition**: Always runs.

---

## fail2ban-installed

**Impact**: High

**What it checks**: Whether fail2ban is installed on the server.

**Commands executed on your server**:
```
which fail2ban-client
```

Fallback:
```
dpkg-query -W -f='${Status}' fail2ban
```

If fail2ban is not found, reports `false`.

**Why it matters**: fail2ban is the primary defense against SSH brute force attacks. Without it installed, there is no automatic blocking of IPs that repeatedly fail authentication.

**Data sent**: `fail2ban.installed` - value: `true` or `false`

---

## fail2ban-active

**Impact**: High

**What it checks**: Whether fail2ban is actively running.

**Commands executed on your server**:
```
systemctl is-active fail2ban | cat
```

The `| cat` ensures the pipeline succeeds regardless of exit code, so the output ("active" or "inactive") reaches the parser.

**Why it matters**: fail2ban being installed but not running provides no protection. Brute force bots scan port 22 continuously. With fail2ban active, an IP is blocked after a few failed attempts. Without it, they can try indefinitely.

**Data sent**: `fail2ban.active` - value: `true` or `false`

---

## security-updates

**Impact**: High

**What it checks**: How many pending security updates are available.

**Commands executed on your server**:
```
apt-get -s upgrade | grep -c '^Inst'
```

Fallback:
```
apt list --upgradable | grep -c security
```

**Why it matters**: Each pending security update patches a known vulnerability with publicly available exploitation tools. The longer updates remain unapplied, the larger the window of exposure.

**Data sent**: `updates.pending_security_updates` - value: number (e.g., `5`)

---

## system-sudo-users

**Impact**: Medium | **Plan**: Paid

**What it checks**: Which users have sudo (administrator) access on the server.

**Commands executed on your server**:
```
grep -E '^sudo|^wheel' /etc/group
```

**Why it matters**: Every user with sudo access can execute any command as root. Old accounts from former team members, test accounts, or backup users with unnecessary sudo access increase the attack surface.

**Data sent**: `system.sudo_users` - value: raw group entry string (parsed by the backend)

---

## system-disk-usage

**Impact**: Info | **Plan**: Paid

**What it checks**: Current disk usage percentage of the root partition.

**Commands executed on your server**:
```
df / | tail -1 | awk '{print $5}' | tr -d '%'
```

**Why it matters**: A full disk can cause application crashes, database corruption, and inability to write logs. It is informational but important context for server health.

**Data sent**: `system.disk_usage_percent` - value: string (e.g., `"67"`)

---

## system-ssl-expiry

**Impact**: Medium | **Plan**: Paid

**What it checks**: When SSL/TLS certificates expire.

**Commands executed on your server**:
```
find /etc/ssl /etc/letsencrypt /etc/caddy ( -name '*.crt' -o -name fullchain.pem ) -exec openssl x509 -enddate -noout -in {} ;
```

Fallback:
```
certbot certificates | grep -E 'Certificate Path|Expiry'
```

If no certificates are found, reports an empty array.

**Why it matters**: An expired SSL certificate makes your site inaccessible on HTTPS and triggers browser warnings that destroy user trust. Certificates expiring within 7 days require immediate action; within 30 days, they require attention.

**Data sent**: `ssl.certificates` - value: array of certificate expiry strings

---

## system-swap

**Impact**: Info | **Plan**: Paid

**What it checks**: Whether swap is enabled on the server.

**Commands executed on your server**:
```
swapon --show | awk 'NR>0 {found=1} END {print found ? "true" : "false"}'
```

Fallback:
```
free -m | awk '/^Swap:/ {print ($2 > 0) ? "true" : "false"}'
```

**Why it matters**: Swap prevents out-of-memory kills but can mask memory pressure. Servers without swap may experience sudden process termination under load.

**Data sent**: `system.swap_enabled` - value: `true` or `false`
