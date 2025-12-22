# 📊 Guide d'Import des Dashboards Grafana

## 🎯 Dashboards Disponibles

Vous avez **3 dashboards** prêts à l'emploi :

1. **`account-deletion-monitoring.json`** - Monitoring des suppressions de comptes
2. **`audit-logs-compliance.json`** - Audit logs et conformité RGPD
3. **`data-exports.json`** - Exports de données et emails

---

## 📥 Méthode 1 : Import Manuel via l'Interface Grafana (Recommandé)

### Étape 1 : Accéder à Grafana

Ouvrez votre navigateur et allez sur :
```
http://localhost:3001
```

**Connexion par défaut :**
- Username: `admin`
- Password: `admin123` (ou celui que vous avez configuré)

### Étape 2 : Importer un Dashboard

1. **Cliquez sur le menu** (☰) en haut à gauche
2. **Dashboards** → **Import**
3. **Upload JSON file** → Sélectionnez un fichier (ex: `account-deletion-monitoring.json`)
4. **Select a Prometheus data source** → Choisissez votre datasource Prometheus
5. **Import** → C'est fait ! ✅

![Import Screenshot](https://grafana.com/static/img/docs/v70/import_step1.png)

### Étape 3 : Répéter pour les 3 dashboards

Répétez l'étape 2 pour chaque fichier :
- `grafana/dashboards/account-deletion-monitoring.json`
- `grafana/dashboards/audit-logs-compliance.json`
- `grafana/dashboards/data-exports.json`

---

## 📂 Méthode 2 : Provisioning Automatique (Docker)

### Configuration Docker Compose

Modifiez votre `docker-compose.yml` :

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      # 👇 Ajouter ces lignes
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/account-deletion-monitoring.json
    depends_on:
      - prometheus
```

### Créer les fichiers de provisioning

**Fichier : `grafana/provisioning/datasources/prometheus.yml`**

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

**Fichier : `grafana/provisioning/dashboards/dashboards.yml`**

```yaml
apiVersion: 1

providers:
  - name: 'VELVENA Dashboards'
    orgId: 1
    folder: 'VELVENA'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

### Redémarrer Grafana

```bash
docker-compose down
docker-compose up -d grafana
```

Les dashboards seront **automatiquement chargés** au démarrage ! ✅

---

## 🔧 Méthode 3 : Import via API (Automatisation)

### Script d'import automatique

**Fichier : `scripts/import-grafana-dashboards.sh`**

```bash
#!/bin/bash

# Configuration
GRAFANA_URL="http://localhost:3001"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"

# Dashboards à importer
DASHBOARDS=(
  "grafana/dashboards/account-deletion-monitoring.json"
  "grafana/dashboards/audit-logs-compliance.json"
  "grafana/dashboards/data-exports.json"
)

echo "🚀 Import des dashboards Grafana..."

for dashboard_file in "${DASHBOARDS[@]}"; do
  echo "📊 Import de $dashboard_file..."

  # Lire le JSON et l'envelopper dans le format attendu
  dashboard_json=$(cat "$dashboard_file")

  # Envoyer à l'API Grafana
  curl -X POST \
    -H "Content-Type: application/json" \
    -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
    -d "{\"dashboard\": $dashboard_json, \"overwrite\": true}" \
    "$GRAFANA_URL/api/dashboards/db"

  echo ""
done

echo "✅ Import terminé !"
```

### Rendre le script exécutable et lancer

```bash
chmod +x scripts/import-grafana-dashboards.sh
./scripts/import-grafana-dashboards.sh
```

---

## 🎨 Configuration Post-Import

### 1. Vérifier la Datasource Prometheus

**Dashboards** → **Settings** → **Variables**

Assurez-vous que la datasource Prometheus est bien sélectionnée.

### 2. Ajuster les Intervalles de Rafraîchissement

En haut à droite de chaque dashboard :
- **Account Deletion Monitoring** : 5s (temps réel)
- **Audit Logs & Compliance** : 10s
- **Data Exports & Emails** : 10s

### 3. Configurer les Alertes (Optionnel)

**Dashboards** → **Settings** → **Alerts**

Ajoutez les alertes recommandées du fichier `METRICS_GUIDE.md`.

---

## 🔍 Vérification

### Vérifier que Prometheus scrape bien l'API

1. Ouvrez Prometheus : `http://localhost:9090`
2. **Status** → **Targets**
3. Vérifiez que `velvena-api` est **UP** ✅

### Tester une métrique

Dans Prometheus, essayez :
```promql
account_deletion_requests_total
```

Vous devriez voir des résultats.

### Tester un Dashboard

1. Ouvrez Grafana : `http://localhost:3001`
2. **Dashboards** → **VELVENA - Account Deletion Monitoring**
3. Les panels devraient afficher des données (ou 0 si aucune suppression n'a eu lieu)

---

## 🚨 Dépannage

### Problème : "No data"

**Cause** : Prometheus ne scrape pas l'API

**Solution** :
```bash
# Vérifier que l'API expose bien /metrics
curl http://localhost:3000/metrics

# Vérifier la config Prometheus
cat prometheus.yml
```

### Problème : "Datasource not found"

**Cause** : La datasource Prometheus n'est pas configurée

**Solution** :
1. **Configuration** → **Data sources** → **Add data source**
2. Choisir **Prometheus**
3. URL : `http://prometheus:9090` (Docker) ou `http://localhost:9090` (local)
4. **Save & Test**

### Problème : Dashboards ne s'importent pas

**Cause** : Format JSON invalide ou version Grafana incompatible

**Solution** :
- Vérifier la syntaxe JSON : `cat grafana/dashboards/account-deletion-monitoring.json | jq`
- Vérifier la version Grafana (>= 9.0 requis)

---

## 📖 Ressources

- [Documentation Grafana - Import Dashboards](https://grafana.com/docs/grafana/latest/dashboards/manage-dashboards/#import-a-dashboard)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Prometheus Queries](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

## ✅ Checklist

- [ ] Grafana et Prometheus démarrés
- [ ] Datasource Prometheus configurée dans Grafana
- [ ] Dashboard 1 : Account Deletion Monitoring importé
- [ ] Dashboard 2 : Audit Logs & Compliance importé
- [ ] Dashboard 3 : Data Exports & Emails importé
- [ ] Panels affichent des données
- [ ] Alertes configurées (optionnel)
- [ ] Accès configuré pour l'équipe

---

**Dernière mise à jour** : 2025-12-20
**Version** : 1.0
**Status** : ✅ READY
