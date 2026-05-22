# SSH Checks

SSH is the primary remote access vector to a Linux server. Misconfigured SSH exposes the server to brute force attacks, unauthorized access, and full compromise.

**Condition**: Always runs. All target Linux servers have SSH.

---

## ssh-root-login

**Impact**: High

**What it checks**: Whether direct root login via SSH is enabled.

**Commands executed on your server**:
```
sshd -T | grep -i permitrootlogin | awk '{print $2}'
```

Fallback if the main command fails:
```
grep -i '^PermitRootLogin' /etc/ssh/sshd_config | awk '{print $2}'
```

**Why it matters**: Root login removes all privilege separation. If an attacker obtains the password or key, they gain full and irreversible control of the server. Disabling root login forces access through a regular user account, adding a layer of defense.

**Data sent**: `ssh.permit_root_login` - value: `"yes"` or `"no"`

---

## ssh-default-port

**Impact**: Medium

**What it checks**: Whether SSH listens on the default port 22.

**Commands executed on your server**:
```
sshd -T | grep -i '^port' | awk '{print $2}'
```

Fallback:
```
grep -i '^Port' /etc/ssh/sshd_config | awk '{print $2}'
```

**Why it matters**: Port 22 is the first target for automated bots scanning the internet. Changing the port does not make SSH more secure in isolation, but significantly reduces noise from automated brute force attempts, especially when combined with fail2ban.

**Data sent**: `ssh.port` - value: e.g., `"22"` or `"2222"`

---

## ssh-password-auth

**Impact**: Medium | **Plan**: Paid

**What it checks**: Whether password-based SSH authentication is enabled (as opposed to key-only authentication).

**Commands executed on your server**:
```
sshd -T | grep -i passwordauthentication | awk '{print $2}'
```

Fallback:
```
grep -i '^PasswordAuthentication' /etc/ssh/sshd_config | awk '{print $2}'
```

**Why it matters**: Password authentication is vulnerable to brute force attacks. Key-based authentication is significantly more secure because it requires possession of a private key file, which cannot be guessed remotely.

**Data sent**: `ssh.password_auth` - value: `"yes"` or `"no"`

---

## ssh-authorized-keys

**Impact**: Info | **Plan**: Paid

**What it checks**: How many SSH public keys are authorized to access the server.

**Commands executed on your server**:
```
find /root/.ssh /home -maxdepth 3 -name authorized_keys -type f -exec wc -l {} + | tail -1 | awk '{print $1}'
```

If no authorized_keys files are found, reports `0`.

**Why it matters**: An unexpectedly high number of authorized keys may indicate that old keys from former team members or compromised systems have not been revoked. This is informational and helps identify key management hygiene.

**Data sent**: `ssh.authorized_keys_count` - value: number (e.g., `3`)
