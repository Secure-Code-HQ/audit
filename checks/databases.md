# Database Checks

Checks whether databases are exposed to the internet or running without authentication. Conditional: only runs for databases detected during stack detection.

**Condition**: Each check runs only if the corresponding database is installed:
- PostgreSQL checks: only if `detected_stack.postgresql === true`
- Redis checks: only if `detected_stack.redis === true`
- MongoDB checks: only if `detected_stack.mongodb === true`

---

## db-postgresql-exposed

**Impact**: High | **Plan**: Paid

**What it checks**: Whether PostgreSQL is listening on network interfaces (port 5432).

**Commands executed on your server**:
```
ss -tlnp | grep :5432 | head -5
```

Fallback:
```
netstat -tlnp | grep :5432 | head -5
```

**Why it matters**: PostgreSQL listening on `0.0.0.0` is accessible from any IP address. Combined with weak credentials or default configurations, this allows remote attackers to read, modify, or delete all data in the database.

**Data sent**: `databases.postgresql_exposed` - value: array of raw listening socket strings (parsed by the backend to determine if bound to 0.0.0.0 or localhost only)

---

## db-redis-auth

**Impact**: High | **Plan**: Paid

**What it checks**: Whether Redis responds without authentication.

**Commands executed on your server**:
```
redis-cli -e ping | head -1
```

Fallback:
```
redis-cli config get requirepass
```

If Redis is not installed or not reachable, reports `null`.

**Why it matters**: Redis without authentication allows anyone who can reach the port to read all cached data, write arbitrary keys, and in many configurations execute system commands via the `EVAL` command. Redis without auth is one of the most exploited misconfigurations in production servers.

**Data sent**: `databases.redis_auth` - value: raw response string (parsed by the backend to determine if auth is configured). `null` if Redis is not reachable.

---

## db-mongodb-exposed

**Impact**: High | **Plan**: Paid

**What it checks**: Whether MongoDB is listening on network interfaces (port 27017).

**Commands executed on your server**:
```
ss -tlnp | grep :27017 | head -5
```

Fallback:
```
netstat -tlnp | grep :27017 | head -5
```

**Why it matters**: MongoDB exposed to the internet without authentication has been the cause of numerous high-profile data breaches. Automated bots continuously scan for open MongoDB instances and can exfiltrate entire databases within minutes of discovery.

**Data sent**: `databases.mongodb_exposed` - value: array of raw listening socket strings (parsed by the backend to determine if bound to 0.0.0.0 or localhost only)
