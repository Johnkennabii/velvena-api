# 🚀 Quick Start - Intégration Calendly

## Démarrage rapide (5 minutes)

### 1. Démarrer le serveur backend

```bash
npm run dev
```

Vérifier que vous voyez:
```
✅ Scheduler démarré et actif (jobs quotidiens + sync Calendly)
▶️ Exécution immédiate du sync Calendly
```

### 2. Lancer le script de test automatique

```bash
./scripts/test-calendly.sh
```

Ce script va:
- ✅ Vérifier que le serveur est accessible
- ✅ S'authentifier automatiquement
- ✅ Vérifier l'état de l'intégration
- ✅ Lister les événements synchronisés
- ✅ Vérifier les prospects créés
- ✅ Déclencher une synchronisation manuelle
- ✅ Vérifier la base de données

### 3. Connecter Calendly (si pas encore fait)

**Via le frontend:**
1. Ouvrir `http://localhost:5173`
2. Se connecter avec `user@velvena.com` / `user123`
3. Aller dans **Paramètres** → **Intégrations**
4. Cliquer sur **"Connecter Calendly"**
5. Autoriser l'application sur Calendly

**Ou via Postman/curl:**

1. Générer l'URL d'autorisation:
```
https://auth.calendly.com/oauth/authorize?client_id=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM&response_type=code&redirect_uri=http://localhost:5173/auth/calendly/callback
```

2. Ouvrir cette URL dans un navigateur et autoriser

3. Copier le `code` de l'URL de redirection

4. Appeler l'API:
```bash
# Se connecter d'abord
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@velvena.com","password":"user123"}' | jq -r '.token')

# Compléter l'OAuth
curl -X POST http://localhost:3000/calendly/oauth/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"VOTRE_CODE_ICI"}'
```

---

## 📊 Endpoints disponibles

### GET /calendly/status
Vérifier l'état de l'intégration

```bash
curl http://localhost:3000/calendly/status \
  -H "Authorization: Bearer $TOKEN"
```

### POST /calendly/oauth/callback
Compléter le flux OAuth (appelé par le frontend)

```bash
curl -X POST http://localhost:3000/calendly/oauth/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"AUTHORIZATION_CODE"}'
```

### GET /calendly/events
Lister les événements synchronisés

```bash
curl http://localhost:3000/calendly/events?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### POST /calendly/sync
Déclencher une synchronisation manuelle

```bash
curl -X POST http://localhost:3000/calendly/sync \
  -H "Authorization: Bearer $TOKEN"
```

### DELETE /calendly/disconnect
Déconnecter l'intégration

```bash
curl -X DELETE http://localhost:3000/calendly/disconnect \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Vérifications en base de données

### Voir les intégrations actives

```bash
psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -c "
  SELECT
    id,
    calendly_user_name,
    calendly_email,
    auto_sync_enabled,
    last_synced_at,
    webhook_active
  FROM \"CalendlyIntegration\"
  WHERE is_active = true;
"
```

### Voir les événements synchronisés

```bash
psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -c "
  SELECT
    event_name,
    invitee_name,
    invitee_email,
    event_start_time,
    event_status
  FROM \"CalendlyEvent\"
  ORDER BY event_start_time DESC
  LIMIT 10;
"
```

### Voir les prospects créés depuis Calendly

```bash
psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -c "
  SELECT
    firstname,
    lastname,
    email,
    source,
    status,
    created_at
  FROM \"Prospect\"
  WHERE source = 'calendly'
  ORDER BY created_at DESC
  LIMIT 10;
"
```

---

## ⚡ Fonctionnalités automatiques

### 1. Synchronisation automatique (toutes les 30 minutes)
- Le backend sync automatiquement les nouveaux événements
- Vérifier les logs: `⏰ Running scheduled Calendly sync`

### 2. Création automatique de prospects
- Chaque nouvel invité Calendly devient un prospect
- Source: `"calendly"`
- Status: `"new"`

### 3. Webhooks temps réel (si configuré)
- Reçoit les événements: `invitee.created`, `invitee.canceled`, `invitee.rescheduled`
- Endpoint: `POST /calendly/webhook`

### 4. Refresh automatique des tokens
- Les tokens OAuth sont rafraîchis automatiquement avant expiration
- Vérifier les logs: `✅ Token refreshed successfully`

---

## 🐛 Dépannage rapide

### Problème: "No active integration found"
**Solution:** Connecter Calendly via le frontend ou l'API

### Problème: "Failed to exchange code for token"
**Solution:**
- Vérifier que `CALENDLY_CLIENT_ID` et `CALENDLY_CLIENT_SECRET` sont corrects
- Le code OAuth expire après 10 minutes, regénérer un nouveau

### Problème: Les événements ne se synchronisent pas
**Solution:**
```bash
# Forcer une sync manuelle
curl -X POST http://localhost:3000/calendly/sync \
  -H "Authorization: Bearer $TOKEN"
```

### Problème: "ENCRYPTION_KEY not set"
**Solution:**
```bash
# Générer une nouvelle clé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# L'ajouter dans .env
echo "ENCRYPTION_KEY=<clé_générée>" >> .env
```

---

## 📖 Documentation complète

Pour des tests plus détaillés, consultez:
- **[CALENDLY_TESTING_GUIDE.md](./CALENDLY_TESTING_GUIDE.md)** - Guide de test complet avec tous les scénarios

---

## ✅ Checklist de validation

- [ ] Serveur backend démarré
- [ ] Script de test exécuté avec succès
- [ ] Intégration Calendly connectée
- [ ] Au moins 1 événement synchronisé
- [ ] Au moins 1 prospect créé depuis Calendly
- [ ] Synchronisation manuelle fonctionne
- [ ] Tokens chiffrés en base de données
- [ ] Logs de sync visibles dans le terminal

Une fois tous ces points validés, l'intégration est prête ! 🎉
