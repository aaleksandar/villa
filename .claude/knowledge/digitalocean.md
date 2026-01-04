# DigitalOcean Knowledge Base

## Quick Reference

```
Platform: App Platform
Region: nyc
CLI: doctl
Apps: villa-production, villa-staging, villa-dev-1, villa-dev-2
Specs: .do/app-*.yaml
```

## Environment Variables

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | API authentication | GitHub Secrets |

## App Architecture

| App | Domain | Trigger | Size |
|-----|--------|---------|------|
| `villa-production` | `villa.cash` | Release tag `v*` | basic-xs |
| `villa-staging` | `beta.villa.cash` | Push to `main` | basic-xxs |
| `villa-dev-1` | `dev-1.villa.cash` | PR (odd #) | basic-xxs |
| `villa-dev-2` | `dev-2.villa.cash` | PR (even #) | basic-xxs |

## Common Operations

### List Apps
```bash
doctl apps list
```

### Get App Details
```bash
doctl apps list --output json | jq '.[] | select(.spec.name == "villa-production")'
```

### Trigger Deploy
```bash
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep "villa-production" | awk '{print $1}')
doctl apps create-deployment $APP_ID
```

### Check Deploy Status
```bash
doctl apps get $APP_ID --output json | jq '.[0].active_deployment.phase'
```

## Patterns

### doctl JSON Output Pattern
```bash
# Always use --output json for reliable parsing
APP_JSON=$(doctl apps get $APP_ID --output json)

# doctl apps get returns an ARRAY, not object
PHASE=$(echo "$APP_JSON" | jq -r '.[0].active_deployment.phase')
```

### Wait for Deploy Pattern
```bash
for i in {1..30}; do
  APP_JSON=$(doctl apps get $APP_ID --output json 2>/dev/null || echo '[]')
  ACTIVE_PHASE=$(echo "$APP_JSON" | jq -r '.[0].active_deployment.phase // empty')
  if [ "$ACTIVE_PHASE" = "ACTIVE" ]; then
    echo "Deploy complete"
    break
  fi
  sleep 10
done
```

### Get App URL Pattern
```bash
# default_ingress includes https:// - strip for CNAME
URL=$(doctl apps list --output json | jq -r '.[] | select(.spec.name == "villa-production") | .default_ingress' | sed 's|https://||')
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| `doctl apps get --format Spec.Name` | `doctl apps get --output json \| jq` |
| Parse `<nil>` from --format | Use jq with `// empty` |
| Assume single object from `apps get` | Use `.[0]` for array |

## App Spec Structure

```yaml
name: villa-{env}
domains:
  - domain: {subdomain}.villa.cash
    type: PRIMARY
services:
  - name: web
    github:
      repo: rockfridrich/villa
      branch: main
      deploy_on_push: true/false
    dockerfile_path: Dockerfile
    http_port: 3000
    instance_size_slug: basic-xxs
    health_check:
      http_path: /api/health
    envs:
      - key: NODE_ENV
        value: {env}
      - key: NEXT_PUBLIC_DOMAIN
        value: {domain}
region: nyc
```

## Learnings

### 2026-01-04: doctl Arrays
**Problem:** jq error "Cannot index array with string"
**Cause:** `doctl apps get` returns array `[{...}]`, not object `{...}`
**Solution:** Always use `.[0]` when parsing apps get output

### 2026-01-04: --format Returns nil
**Problem:** `doctl apps list --format DefaultIngress` returns `<nil>`
**Cause:** --format can't access nested fields reliably
**Solution:** Use `--output json | jq` for all data extraction

### 2026-01-04: default_ingress Includes Protocol
**Problem:** CNAME creation failed with "invalid content"
**Cause:** `default_ingress` returns `https://app.ondigitalocean.app`
**Solution:** Strip protocol: `sed 's|https://||'`

## Troubleshooting

### Deploy Stuck in PENDING_BUILD
- Check Dockerfile exists and is valid
- Check GitHub connection is authorized
- Check branch exists

### Domain Verification Failed
- Ensure CNAME points to DO app URL
- If using CloudFlare proxy, temporarily disable
- Trigger redeploy to retry verification

### Health Check Failing
- Verify `/api/health` endpoint exists
- Check it returns 200 OK
- Increase `initial_delay_seconds` for slow starts
