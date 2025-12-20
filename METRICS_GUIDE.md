# 📊 Guide des Métriques VELVENA

## 🎯 Métriques Disponibles

### Account Deletion (Suppression de Compte)

| Métrique | Type | Description |
|----------|------|-------------|
| `account_deletion_requests_total` | Counter | Nombre total de demandes de suppression (labels: `status`, `role`) |
| `account_deletion_validation_failures_total` | Counter | Nombre d'échecs de validation (labels: `reason`) |
| `account_deletion_confirmed_total` | Counter | Nombre de suppressions confirmées (labels: `role`) |
| `account_deletion_duration_seconds` | Histogram | Durée du processus complet de suppression |
| `account_deletion_records_deleted` | Gauge | Nombre d'enregistrements supprimés (labels: `resource_type`) |

**Exemples de requêtes Prometheus :**

```promql
# Taux de demandes de suppression par heure
rate(account_deletion_requests_total[1h])

# Taux de succès des suppressions
sum(account_deletion_requests_total{status="success"}) / sum(account_deletion_requests_total)

# Durée médiane (p50) des suppressions
histogram_quantile(0.5, rate(account_deletion_duration_seconds_bucket[5m]))

# Durée p95 (95% des suppressions prennent moins de X secondes)
histogram_quantile(0.95, rate(account_deletion_duration_seconds_bucket[5m]))

# Nombre de codes de validation invalides
sum(account_deletion_validation_failures_total{reason="invalid_code"})
```

---

### Audit Logs

| Métrique | Type | Description |
|----------|------|-------------|
| `audit_logs_created_total` | Counter | Nombre total d'audit logs créés (labels: `action`, `status`) |
| `audit_logs_total_count` | Gauge | Nombre total d'audit logs en base |
| `audit_logs_expired_count` | Gauge | Nombre de logs à nettoyer (> 7 ans) |

**Exemples de requêtes Prometheus :**

```promql
# Taux de création d'audit logs
rate(audit_logs_created_total[5m])

# Logs créés par action
sum by (action) (audit_logs_created_total)

# Nombre de logs à nettoyer
audit_logs_expired_count
```

---

### Data Export

| Métrique | Type | Description |
|----------|------|-------------|
| `data_exports_total` | Counter | Nombre total d'exports (labels: `status`) |
| `export_file_size_bytes` | Histogram | Taille des fichiers d'export |
| `export_duration_seconds` | Histogram | Durée du processus d'export |

**Exemples de requêtes Prometheus :**

```promql
# Taux d'exports réussis
rate(data_exports_total{status="success"}[1h])

# Taille médiane des exports
histogram_quantile(0.5, rate(export_file_size_bytes_bucket[5m]))

# Durée moyenne des exports
rate(export_duration_seconds_sum[5m]) / rate(export_duration_seconds_count[5m])
```

---

### Email

| Métrique | Type | Description |
|----------|------|-------------|
| `emails_sent_total` | Counter | Nombre total d'emails envoyés (labels: `type`, `status`) |
| `email_send_duration_seconds` | Histogram | Durée d'envoi d'email |

**Exemples de requêtes Prometheus :**

```promql
# Taux d'emails envoyés avec succès
rate(emails_sent_total{status="success"}[1h])

# Taux d'échec d'envoi d'email
rate(emails_sent_total{status="failure"}[1h])

# Temps moyen d'envoi d'email
rate(email_send_duration_seconds_sum[5m]) / rate(email_send_duration_seconds_count[5m])
```

---

### Redis

| Métrique | Type | Description |
|----------|------|-------------|
| `redis_operations_total` | Counter | Nombre d'opérations Redis (labels: `operation`, `status`) |

**Exemples de requêtes Prometheus :**

```promql
# Taux d'opérations Redis
rate(redis_operations_total[5m])

# Taux d'échec Redis
rate(redis_operations_total{status="failure"}[5m])
```

---

## 📈 Dashboard Grafana Recommandés

### Dashboard 1 : Account Deletion Monitoring

**Panels à créer :**

1. **Demandes de suppression (dernières 24h)**
   - Type: Time series
   - Query: `sum(rate(account_deletion_requests_total[5m])) * 60`
   - Unit: req/min

2. **Taux de succès**
   - Type: Stat
   - Query: `sum(account_deletion_requests_total{status="success"}) / sum(account_deletion_requests_total) * 100`
   - Unit: %

3. **Durée des suppressions (p50, p95, p99)**
   - Type: Time series
   - Queries:
     - p50: `histogram_quantile(0.5, rate(account_deletion_duration_seconds_bucket[5m]))`
     - p95: `histogram_quantile(0.95, rate(account_deletion_duration_seconds_bucket[5m]))`
     - p99: `histogram_quantile(0.99, rate(account_deletion_duration_seconds_bucket[5m]))`
   - Unit: s

4. **Échecs de validation**
   - Type: Bar chart
   - Query: `sum by (reason) (account_deletion_validation_failures_total)`

5. **Enregistrements supprimés**
   - Type: Bar chart
   - Query: `sum by (resource_type) (account_deletion_records_deleted)`

6. **Suppressions par rôle**
   - Type: Pie chart
   - Query: `sum by (role) (account_deletion_confirmed_total)`

---

### Dashboard 2 : Audit Logs & Compliance

**Panels à créer :**

1. **Audit logs créés (par action)**
   - Type: Bar chart
   - Query: `sum by (action) (audit_logs_created_total)`

2. **Taux de création de logs**
   - Type: Time series
   - Query: `sum(rate(audit_logs_created_total[5m])) * 60`
   - Unit: logs/min

3. **Total des logs en base**
   - Type: Stat
   - Query: `audit_logs_total_count`

4. **Logs à nettoyer (> 7 ans)**
   - Type: Stat
   - Query: `audit_logs_expired_count`
   - Threshold: > 1000 (warning), > 10000 (critical)

---

### Dashboard 3 : Data Exports

**Panels à créer :**

1. **Exports (succès vs échecs)**
   - Type: Time series
   - Queries:
     - Success: `sum(rate(data_exports_total{status="success"}[5m])) * 60`
     - Failure: `sum(rate(data_exports_total{status="failure"}[5m])) * 60`

2. **Taille des exports (distribution)**
   - Type: Heatmap
   - Query: `sum(rate(export_file_size_bytes_bucket[5m])) by (le)`

3. **Durée des exports (p50, p95)**
   - Type: Time series
   - Queries:
     - p50: `histogram_quantile(0.5, rate(export_duration_seconds_bucket[5m]))`
     - p95: `histogram_quantile(0.95, rate(export_duration_seconds_bucket[5m]))`

---

## 🚨 Alertes Recommandées

### Alerte 1 : Taux élevé de suppressions

```yaml
alert: HighAccountDeletionRate
expr: sum(rate(account_deletion_requests_total[5m])) > 10
for: 5m
annotations:
  summary: "Taux de suppression de comptes élevé"
  description: "Plus de 10 demandes de suppression par 5 minutes"
labels:
  severity: warning
```

### Alerte 2 : Échec d'envoi d'email

```yaml
alert: EmailSendFailure
expr: sum(rate(emails_sent_total{status="failure"}[5m])) > 0
for: 2m
annotations:
  summary: "Échecs d'envoi d'emails détectés"
  description: "Des emails ne sont pas envoyés correctement"
labels:
  severity: critical
```

### Alerte 3 : Durée de suppression anormale

```yaml
alert: SlowAccountDeletion
expr: histogram_quantile(0.95, rate(account_deletion_duration_seconds_bucket[5m])) > 120
for: 10m
annotations:
  summary: "Processus de suppression lent"
  description: "95% des suppressions prennent plus de 2 minutes"
labels:
  severity: warning
```

### Alerte 4 : Audit logs à nettoyer

```yaml
alert: TooManyExpiredAuditLogs
expr: audit_logs_expired_count > 10000
for: 1h
annotations:
  summary: "Trop de logs d'audit à nettoyer"
  description: "Plus de 10 000 audit logs ont dépassé la période de rétention"
labels:
  severity: info
```

### Alerte 5 : Échec d'export de données

```yaml
alert: DataExportFailure
expr: sum(rate(data_exports_total{status="failure"}[5m])) > 0
for: 5m
annotations:
  summary: "Échec d'export de données"
  description: "Des exports de données échouent"
labels:
  severity: critical
```

---

## 🔧 Configuration Prometheus

Assurez-vous que votre `prometheus.yml` contient :

```yaml
scrape_configs:
  - job_name: 'velvena-api'
    scrape_interval: 15s
    static_configs:
      - targets: ['api:3000']  # Ou localhost:3000
```

---

## ✅ Checklist d'Utilisation

- [x] Métriques exposées sur `/metrics`
- [ ] Prometheus configuré pour scraper `/metrics`
- [ ] Dashboards Grafana créés
- [ ] Alertes configurées
- [ ] Tests de performance effectués
- [ ] Documentation partagée avec l'équipe

---

**Dernière mise à jour** : 2025-12-20
**Version** : 1.0
**Status** : ✅ PRODUCTION READY
