# Guide de Test - Intégration Calendly OAuth

## 📋 Prérequis

### 1. Vérifier les variables d'environnement

```bash
# Vérifier que toutes les variables Calendly sont configurées
grep CALENDLY .env
grep ENCRYPTION_KEY .env
```

Vous devriez voir:
```
CALENDLY_CLIENT_ID=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM
CALENDLY_CLIENT_SECRET=2ewe5Yhl4nGgapJoJWBtoM27kHBSAWNOhGPLRXVKKJs
CALENDLY_WEBHOOK_SIGNING_KEY=j0xTdQAKAehQKeHzwMAEb-Qqk4o8DUWhH8IehaXycoU
CALENDLY_REDIRECT_URI=http://localhost:5173/auth/calendly/callback
ENCRYPTION_KEY=af96113aa478da2c267af5589876b660149dfccdaa24a4c88bdc565f780d2e76
```

### 2. Démarrer le serveur backend

```bash
# Dans le terminal du backend
npm run dev
```

Vérifier que vous voyez:
```
🚀 API + Socket.IO running on http://0.0.0.0:3000
⏰ Scheduler de maintenance démarré
▶️ Exécution immédiate du sync Calendly
```

### 3. Vérifier que le frontend est démarré

```bash
# Dans un autre terminal, aller dans le dossier du frontend
cd ../velvena-app
npm run dev
```

Le frontend devrait être accessible sur `http://localhost:5173`

---

## 🧪 Tests à effectuer

### Test 1: Vérifier l'état de l'intégration (avant connexion)

```bash
# Se connecter avec votre utilisateur
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@velvena.com",
    "password": "user123"
  }'
```

Copier le token dans la réponse, puis:

```bash
# Remplacer <TOKEN> par votre token JWT
curl -X GET http://localhost:3000/calendly/status \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu:**
```json
{
  "connected": false,
  "integration": null
}
```

---

### Test 2: Flux OAuth - Connexion à Calendly

#### Option A: Via le frontend (recommandé)

1. **Se connecter au frontend** : `http://localhost:5173`
2. **Aller dans les paramètres** → Intégrations → Calendly
3. **Cliquer sur "Connecter Calendly"**
4. **Autoriser l'application** sur Calendly
5. **Être redirigé vers le callback**

Le frontend devrait:
- Extraire le `code` de l'URL
- Appeler `POST /calendly/oauth/callback` avec le code
- Afficher un message de succès

#### Option B: Via Postman/curl (manuel)

1. **Générer l'URL d'autorisation manuellement:**

```
https://auth.calendly.com/oauth/authorize?client_id=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM&response_type=code&redirect_uri=http://localhost:5173/auth/calendly/callback
```

2. **Ouvrir cette URL dans un navigateur**
3. **Autoriser l'application**
4. **Copier le code** depuis l'URL de redirection:
   ```
   http://localhost:5173/auth/calendly/callback?code=XXXXXX
   ```

5. **Appeler l'endpoint callback:**

```bash
curl -X POST http://localhost:3000/calendly/oauth/callback \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "VOTRE_CODE_ICI"
  }'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Calendly integration connected successfully",
  "integration": {
    "id": "uuid-here",
    "calendly_user_name": "Your Name",
    "calendly_email": "your@email.com",
    "auto_sync_enabled": true
  }
}
```

---

### Test 3: Vérifier l'état de l'intégration (après connexion)

```bash
curl -X GET http://localhost:3000/calendly/status \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu:**
```json
{
  "connected": true,
  "integration": {
    "id": "uuid-here",
    "calendly_user_name": "Your Name",
    "calendly_email": "your@email.com",
    "auto_sync_enabled": true,
    "sync_interval_minutes": 30,
    "last_synced_at": "2026-01-02T12:30:00.000Z",
    "last_sync_error": null,
    "next_sync_at": "2026-01-02T13:00:00.000Z",
    "webhook_active": true,
    "created_at": "2026-01-02T12:14:28.000Z"
  }
}
```

---

### Test 4: Vérifier la synchronisation automatique

Après la connexion, le backend devrait automatiquement:
1. Synchroniser les événements Calendly
2. Créer des prospects pour les nouveaux invités

**Vérifier les logs du backend:**
```
✅ Calendly integration synced successfully
📊 Created new prospect from Calendly event
```

**Vérifier dans la base de données:**

```bash
psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -c "
  SELECT id, calendly_user_name, auto_sync_enabled, last_synced_at
  FROM \"CalendlyIntegration\"
  WHERE is_active = true;
"
```

```bash
psql postgresql://velvena_user:velvena_password@localhost:5432/velvena_db -c "
  SELECT id, event_name, invitee_name, invitee_email, event_start_time, event_status
  FROM \"CalendlyEvent\"
  ORDER BY event_start_time DESC
  LIMIT 5;
"
```

---

### Test 5: Lister les événements synchronisés

```bash
curl -X GET http://localhost:3000/calendly/events \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu:**
```json
{
  "events": [
    {
      "id": "uuid-here",
      "event_name": "30 Minute Meeting",
      "event_start_time": "2026-01-05T10:00:00.000Z",
      "event_end_time": "2026-01-05T10:30:00.000Z",
      "event_status": "active",
      "invitee_name": "John Doe",
      "invitee_email": "john@example.com",
      "location": "https://zoom.us/j/123456789",
      "prospect": {
        "id": "uuid-here",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com",
        "status": "new"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### Test 6: Déclencher une synchronisation manuelle

```bash
curl -X POST http://localhost:3000/calendly/sync \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Synced 3 events successfully",
  "synced_count": 3
}
```

---

### Test 7: Vérifier la création automatique de prospects

1. **Créer un nouveau rendez-vous sur Calendly** (utilisez votre lien de planification Calendly)
2. **Attendre 30 secondes** (webhook ou sync automatique)
3. **Vérifier qu'un prospect a été créé:**

```bash
curl -X GET http://localhost:3000/prospects \
  -H "Authorization: Bearer <TOKEN>"
```

Vous devriez voir le nouveau prospect avec `source: "calendly"`

---

### Test 8: Tester les webhooks (optionnel - nécessite ngrok)

Pour tester les webhooks en local, vous avez besoin d'exposer votre API publiquement:

1. **Installer ngrok:**
```bash
brew install ngrok
# ou télécharger depuis https://ngrok.com/download
```

2. **Exposer votre API:**
```bash
ngrok http 3000
```

3. **Copier l'URL HTTPS** (ex: `https://abc123.ngrok.io`)

4. **Créer la souscription webhook:**
```bash
# Dans le code calendlyService.ts, la webhook est créée automatiquement
# lors de la connexion OAuth avec l'URL: ${APP_URL}/api/calendly/webhook
```

5. **Créer/annuler un rendez-vous sur Calendly**

6. **Vérifier les logs du backend** pour voir:
```
🎣 Received Calendly webhook event: invitee.created
✅ Calendly event synced from webhook
```

---

### Test 9: Déconnecter l'intégration

```bash
curl -X DELETE http://localhost:3000/calendly/disconnect \
  -H "Authorization: Bearer <TOKEN>"
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Calendly integration disconnected successfully"
}
```

**Vérifier l'état après déconnexion:**
```bash
curl -X GET http://localhost:3000/calendly/status \
  -H "Authorization: Bearer <TOKEN>"
```

Devrait retourner:
```json
{
  "connected": false,
  "integration": null
}
```

---

## 🐛 Dépannage

### Problème 1: "ENCRYPTION_KEY environment variable is not set"

**Solution:**
Vérifier que la clé est bien dans le `.env`:
```bash
grep ENCRYPTION_KEY .env
```

Si absente, générer une nouvelle clé:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Problème 2: "Failed to exchange code for token"

**Causes possibles:**
- Le code OAuth a expiré (valide 10 minutes)
- Le `CALENDLY_CLIENT_ID` ou `CALENDLY_CLIENT_SECRET` est incorrect
- Le `CALENDLY_REDIRECT_URI` ne correspond pas à celui configuré dans Calendly

**Vérification:**
```bash
# Vérifier les credentials
grep CALENDLY .env

# Vérifier dans Calendly Dashboard
# https://calendly.com/integrations/api_webhooks
```

### Problème 3: Tokens expirés après quelques heures

**Solution:**
Le refresh automatique devrait gérer ça. Vérifier les logs:
```
✅ Token refreshed successfully for integration: <id>
```

Si le refresh échoue, le `refresh_token` est peut-être invalide. Reconnecter l'intégration.

### Problème 4: Les événements ne se synchronisent pas

**Vérifications:**
1. L'intégration est active: `auto_sync_enabled = true`
2. Le scheduler tourne (vérifier les logs au démarrage)
3. Pas d'erreur dans `last_sync_error`

**Forcer une sync manuelle:**
```bash
curl -X POST http://localhost:3000/calendly/sync \
  -H "Authorization: Bearer <TOKEN>"
```

### Problème 5: Webhooks ne fonctionnent pas

**Vérifications:**
1. L'URL webhook est accessible publiquement (utiliser ngrok en dev)
2. La signature webhook est vérifiée correctement
3. Le `CALENDLY_WEBHOOK_SIGNING_KEY` est correct

---

## ✅ Checklist complète

- [ ] Variables d'environnement configurées
- [ ] Backend démarré sans erreurs
- [ ] Frontend démarré
- [ ] OAuth flow réussi (Test 2)
- [ ] Intégration active (Test 3)
- [ ] Événements synchronisés (Test 4)
- [ ] Prospects créés automatiquement (Test 7)
- [ ] Sync manuelle fonctionne (Test 6)
- [ ] Déconnexion fonctionne (Test 9)
- [ ] Webhooks configurés (optionnel en dev)

---

## 📊 Données de test

Pour des tests plus complets, créez plusieurs rendez-vous sur votre Calendly avec:
- Différents types d'événements
- Questions personnalisées
- Différents statuts (active, canceled)

Cela vous permettra de tester:
- La gestion de plusieurs événements
- Les questions personnalisées stockées en JSON
- Les mises à jour d'événements
- Les annulations

---

## 🚀 Prochaines étapes

Une fois tous les tests passés:
1. Tester avec plusieurs organisations
2. Vérifier les performances avec beaucoup d'événements
3. Tester le refresh automatique des tokens (attendre expiration)
4. Merger la branche `feature/calendly-integration` vers `main`
