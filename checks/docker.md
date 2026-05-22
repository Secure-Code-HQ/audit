# Docker Checks

Docker security configuration: container identification, port exposure, and API access.

**Condition**: Only runs if Docker (or Podman) is detected on the server (`detected_stack.docker === true`). Skipped entirely on servers without Docker.

---

## docker-api-exposed

**Impact**: High | **Plan**: Paid

**What it checks**: Whether the Docker API is accessible over the network (port 2375).

**Commands executed on your server**:
```
ss -tlnp | grep :2375 | awk '{found=1} END {print found ? "true" : "false"}'
```

**Why it matters**: The Docker API provides full control over all containers and the host system. An exposed Docker API without authentication is equivalent to giving root shell access to anyone on the network. This is consistently rated as one of the most dangerous server misconfigurations.

**Data sent**: `docker.api_exposed` - value: `true` or `false`

---

## docker-root-containers

**Impact**: Medium | **Plan**: Paid

**What it checks**: Which containers are currently running (for root user analysis by the backend).

**Commands executed on your server**:
```
docker ps --no-trunc --format '{{.ID}} {{.Names}}'
```

Fallback:
```
podman ps --no-trunc --format '{{.ID}} {{.Names}}'
```

If no containers are running, reports an empty array.

**Why it matters**: A container running as root has elevated privileges inside the container. If a vulnerability allows escaping the container, the attacker lands as root on the host. Running containers as a non-root user limits the blast radius of a container escape. The backend analyzes container details to determine which run as root.

**Data sent**: `docker.root_containers` - value: array of container ID and name strings

---

## docker-exposed-ports

**Impact**: High | **Plan**: Paid

**What it checks**: Which container ports are bound to network interfaces.

**Commands executed on your server**:
```
docker ps --format '{{.Ports}}'
```

Fallback:
```
podman ps --format '{{.Ports}}'
```

If no containers have exposed ports, reports an empty array.

**Why it matters**: Docker manages its own iptables rules, which can bypass UFW. A container port bound to `0.0.0.0` is accessible from the internet even if UFW shows no rule for it. This is one of the most common Docker security misconfigurations.

**Data sent**: `docker.exposed_ports` - value: array of port mapping strings (e.g., `["0.0.0.0:5432->5432/tcp"]`)
