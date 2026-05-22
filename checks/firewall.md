# Firewall Checks

The firewall controls which ports are accessible from the internet. Misconfigured firewall rules can expose internal services (databases, admin panels) to anyone.

**Condition**: Always runs.

---

## firewall-open-ports

**Impact**: High

**What it checks**: Which ports are open to incoming connections.

**Commands executed on your server**:
```
ss -tlnp
```

Fallback:
```
netstat -tlnp
```

**Why it matters**: Every open port is a potential entry point. Ports for web traffic (80, 443) and SSH (22) are expected. But open ports for databases (5432, 6379, 27017), Docker API (2375), or development servers (3000, 8080) can expose sensitive services directly to the internet.

**Data sent**: `firewall.open_ports` - value: array of strings with raw listening socket output (parsed by the backend)
