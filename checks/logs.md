# Log Analysis Checks

Analyzes authentication logs to detect brute force attempts, identify attacking IPs, and detect coordinated attacks in progress.

**Condition**: Always runs. These checks are part of the complete analysis.

---

## logs-failed-logins

**Impact**: Info | **Plan**: Paid

**What it checks**: How many failed SSH login attempts are recorded in the authentication log.

**Commands executed on your server**:
```
grep -c 'Failed password' /var/log/auth.log
```

Fallbacks:
```
journalctl -u sshd --since '24h ago' | grep -c Failed
```
```
lastb --since yesterday | wc -l
```

If no failed login attempts are found, reports `0`.

**Why it matters**: A baseline count of failed login attempts helps distinguish normal background noise from targeted attacks. Fewer than 50 attempts is typical for a public server. More than 200 suggests active brute force activity.

**Data sent**: `logs.failed_login_attempts_24h` - value: number (e.g., `142`)

---

## logs-top-attacking-ips

**Impact**: Info | **Plan**: Paid

**What it checks**: Which IP addresses generated the most failed login attempts.

**Commands executed on your server**:
```
grep 'Failed password' /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10
```

If no attacking IPs are found, reports an empty array.

**Why it matters**: Identifying the source IPs of brute force attempts allows targeted blocking and helps assess whether attacks are distributed (many IPs, bot network) or focused (few IPs, targeted attack).

**Data sent**: `logs.top_attacking_ips` - value: array of count and IP strings (e.g., `["147 185.220.101.45", "89 45.33.32.156"]`)

---

## logs-active-attack

**Impact**: Medium | **Plan**: Paid

**What it checks**: Whether there is a coordinated attack in progress, based on whether any single IP has more than 50 failed login attempts.

**Commands executed on your server**:
```
grep 'Failed password' /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | awk '$1 > 50 {found=1} END {print found ? "true" : "false"}'
```

Fallback:
```
journalctl -u ssh --since '1h ago' | grep -c Failed | awk '{print ($1 > 50) ? "true" : "false"}'
```

**Why it matters**: An active attack means the server is being targeted right now. This is different from background noise: it indicates a deliberate and ongoing attempt to gain access. The urgency of hardening recommendations increases significantly when an active attack is detected.

**Data sent**: `logs.active_attack_detected` - value: `true` or `false`
