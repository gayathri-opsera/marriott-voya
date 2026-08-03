# DR Game Day — WO-088: Disaster Recovery runbook and cross-region rebuild procedure.
# Last tested: 2026-07-30 | Next scheduled: 2026-10-30

## Overview

Quarterly chaos game day validating cross-region failover and rebuild procedures
for the Marriott-Voya platform. Target: RTO ≤ 4 hours, RPO ≤ 15 minutes.

---

## Pre-Game Day Checklist

- [ ] Notify stakeholders (48h advance)
- [ ] Freeze deployments 2h before start
- [ ] Confirm monitoring access for all participants
- [ ] Verify staging environment is isolated from prod
- [ ] Ensure DR runbooks are up to date

---

## Scenario 1: Primary Region AZ Failure (us-east-1a loss)

**Objective**: Verify multi-AZ failover with zero data loss.

### Steps

1. **Simulate**: Remove `us-east-1a` subnets from ALB target groups
2. **Observe**:
   - ECS tasks migrate to `us-east-1b` / `us-east-1c` within 2 minutes
   - RDS Aurora promotes replica in surviving AZ (< 60s)
   - CloudWatch alarms fire within 1 minute
3. **Validate**:
   - Run booking creation E2E test — assert success
   - Run payment flow E2E test — assert success
   - Confirm CloudWatch dashboard shows normal after failover

**Pass criteria**: Full service restored in < 5 minutes, 0 data loss.

---

## Scenario 2: Database Complete Failure (RDS replacement)

**Objective**: Validate PITR (Point-In-Time Recovery) and RDS Proxy reconnect.

### Steps

1. **Capture**: Note current `latest_restorable_time` from AWS console
2. **Simulate**: Force-stop the primary RDS writer instance
3. **Observe**:
   - Aurora auto-promotes reader replica to writer (< 30s)
   - RDS Proxy reroutes connections to new writer
   - ECS services reconnect without restart
4. **Validate**:
   - Query booking counts before/after — must match
   - Audit log chain intact (no gaps in hash chain)
   - Confirm payment idempotency — no duplicate charges

**Pass criteria**: Failover complete in < 2 minutes, 0 data loss.

---

## Scenario 3: Full Region Rebuild (us-east-1 → us-west-2)

**Objective**: Validate Terraform-driven cross-region rebuild from scratch.

### Steps

```bash
# 1. Restore database from latest snapshot to us-west-2
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier travel-prod-dr \
  --snapshot-identifier arn:aws:rds:us-east-1:ACCOUNT:cluster-snapshot:latest \
  --engine aurora-postgresql \
  --db-subnet-group-name travel-dr-subnet-group \
  --region us-west-2

# 2. Deploy infrastructure to us-west-2
cd infra/terraform/environments/dr
terraform init
terraform apply -var="region=us-west-2" -var="environment=production" -auto-approve

# 3. Update Route 53 weighted routing
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dr-failover-dns.json

# 4. Verify health checks pass
curl -f https://api.voya.travel/health
```

5. **Validate**:
   - All 10 ECS services report healthy
   - Booking search returns results
   - End-to-end booking creation succeeds
   - SLO dashboard shows availability > 99%

**Target RTO**: 4 hours | **Actual**: _(record after each game day)_

---

## Scenario 4: Secrets Rotation Under Load

**Objective**: Validate zero-downtime AWS Secrets Manager rotation.

### Steps

1. Trigger rotation for `JWT_SECRET` in Secrets Manager
2. Observe ECS tasks pick up new secret via IRSA (no restart needed)
3. Confirm existing JWT tokens still valid during 15-min overlap window
4. Confirm old secret version is deprecated after 24h

**Pass criteria**: 0 authentication errors during rotation.

---

## Post-Game Day Checklist

- [ ] Document actual RTO/RPO achieved
- [ ] File tickets for any failures or gaps
- [ ] Update runbooks with lessons learned
- [ ] Schedule next game day (quarterly)
- [ ] Confirm error budgets not breached by the game day itself

---

## RTO / RPO Targets

| Tier | Target RTO | Target RPO | Service |
|------|-----------|-----------|---------|
| Tier 1 (P0) | 1 hour | 15 minutes | booking, payment, auth |
| Tier 2 (P1) | 4 hours | 1 hour | search, ai, notifications |
| Tier 3 (P2) | 24 hours | 4 hours | analytics, reporting |

---

## Contact Roster

| Role | Name | On-call channel |
|------|------|----------------|
| Platform Lead | TBD | PagerDuty |
| Database DBA | TBD | PagerDuty |
| Security Lead | TBD | Slack #incidents |
| Cloud Infra | TBD | Slack #infra |
