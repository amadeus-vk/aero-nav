---
Status: Resolved
Type: Bug
---

# 002 - Docker compose port collision

**Description**
Failed to deploy the stack because `0.0.0.0:8000` is already allocated by another container (Portainer).

**Resolution**
Modified `docker-compose.yml` to map host port `8087` to container port `8000`.
Updated `README.md` to reflect the new local access URL: `http://localhost:8087`.
