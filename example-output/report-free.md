# Security Analysis - example-app.io

**Server**: 203.0.113.42  
**Detected stack**: Ubuntu 22.04.3 LTS · Docker · Caddy · Node.js · Redis  
**Date**: April 27, 2026  
**Plan**: Server Audit Free

---

**Status: Attention required 🟠**  
2 critical issues · 2 warnings · 2 passed  
*Analysis based on 7 of 25 available security checks.*

---

## ❌ Critical issues (2)

### Secrets exposed in version control

File detected: `/var/www/myapp/.env`

This file contains credentials and is being tracked by Git. If the repository was public at any point, your database keys, API keys, and passwords are compromised and you cannot know for certain: Git history cannot be retroactively erased.

→ **How to fix: included in the full report**

---

### Server without automated attack protection

Fail2ban is not installed on this server.

Your server does not automatically block IPs that repeatedly attempt to connect. Brute force attacks against remote access are continuous and fully automated. Every server accessible from the internet receives them, 24/7.

→ **How to fix: included in the full report**

---

## ⚠️ Warnings (2)

### Remote access on standard port

Detected port: **22** (default port, priority target for automated bots)

→ **How to reduce exposure: included in the full report**

---

### Pending security updates

**5 security updates** available and not yet applied on this server. Each one patches documented vulnerabilities with publicly available exploitation tools.

→ **What to update and how: included in the full report**

---

## ✅ Passed (2)

- ✓ **SSH administrator access**: disabled (direct root login is not possible)
- ✓ **Firewall**: only expected ports open to the internet (22, 80, 443)

---

## 🔒 18 additional checks · not evaluated in this analysis

Your server has **Redis**, **Docker**, and **Caddy** active. These technologies have specific configurations that can expose your application and your users' data. The basic analysis does not cover them.

---

🔒 **Session database without password** *(not evaluated)*

Your server has Redis active. The full report verifies whether any program running on your server can read the data of all your currently connected users without any credentials, if no password is configured.

---

🔒 **Applications with full administrator privileges** *(not evaluated)*

You have active Docker containers. The full report verifies whether they are configured so that someone who finds a vulnerability in your application could take complete control of the server: other apps, databases, files of all users.

---

🔒 **SSL certificate: expiration date** *(not evaluated)*

Caddy was detected as an active proxy on your server. The full report verifies whether your SSL certificate is close to expiring. When a certificate expires, your application becomes completely inaccessible to all users until it is renewed.

---

🔒 **What an attacker sees from the internet** *(not evaluated)*

The full report runs an external analysis from our servers against your public IP. It detects database ports or administrative tools that Docker may have exposed to the internet even though your firewall says they are closed.

---

*...and 14 more checks covering configuration file permissions, environment variables visible in system processes, users with administrator access, and resource usage.*

---

*This report reflects the state of the server at the time of analysis. It does not constitute a security guarantee. Server Audit detects known risk configurations but cannot guarantee the absence of vulnerabilities not covered by the checks executed.*

*Generated April 27, 2026 · Server Audit v1.1.0 · Free Plan*  
*Report ID: rpt_example · Audited IP: 203.0.113.42*
