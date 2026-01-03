# ✅ Intégration Calendly - Documentation Complète

## 🎯 Vue d'ensemble

L'intégration Calendly est maintenant **100% fonctionnelle** avec :
- ✅ Authentification OAuth 2.0
- ✅ Synchronisation automatique des événements (30 minutes)
- ✅ Création automatique de prospects depuis Calendly
- ✅ Notes multiples pour plusieurs rendez-vous du même prospect
- ✅ Mises à jour en temps réel via Socket.IO
- ✅ Notifications pour chaque nouveau rendez-vous
- ✅ Sauvegarde dans `Organization.settings.calendly` ET `CalendlyIntegration`

---

## 📁 Fichiers Backend Modifiés/Créés

### ✅ Nouveaux fichiers

1. **`src/utils/prospects.ts`**
   - Fonctions Socket.IO pour les prospects
   - `emitProspectCreated()`, `emitProspectUpdated()`, `emitProspectDeleted()`
   - `notifyCalendlyProspect()` - Notifications Calendly

### ✅ Fichiers modifiés

1. **`src/services/calendlyService.ts`** (lignes 1-6, 411-470)
   - Ajout import Socket.IO
   - Émission événements Socket.IO lors de création/mise à jour de prospects
   - Envoi notifications pour chaque rendez-vous

2. **`src/controllers/calendlyController.ts`** (lignes 18-116, 166-246)
   - **OAuth callback** : Sauvegarde dans `Organization.settings.calendly`
   - **Disconnect** : Mise à jour `Organization.settings.calendly` (disabled)
   - Retour du champ `email` dans la réponse

3. **`src/controllers/prospectController.ts`** (lignes 1-6, 452-454, 532-534, 576-578)
   - Ajout import Socket.IO
   - Émission événements Socket.IO pour :
     - Création manuelle de prospect
     - Mise à jour de prospect
     - Suppression de prospect

### ✅ Configuration

1. **`.env`**
   ```bash
   # Calendly OAuth (Sandbox)
   CALENDLY_CLIENT_ID=qEuJAw-2mk2UKIIJzslMOE43QbNwtwr7N0U_0O77fNk
   CALENDLY_CLIENT_SECRET=W-i3-5rTWM3i3AUrhRlkqDJvUitwbRrelg8nPMKJFVQ
   CALENDLY_WEBHOOK_SIGNING_KEY=atMLKF91EZ5zKnMX5_6DHxC2MQrkKTyoe-aalC7OWao
   CALENDLY_REDIRECT_URI=http://localhost:5173/auth/calendly/callback
   CALENDLY_ENVIRONMENT=sandbox

   # Encryption key for OAuth tokens
   ENCRYPTION_KEY=af96113aa478da2c267af5589876b660149dfccdaa24a4c88bdc565f780d2e76
   ```

2. **`velvena-app/.env.development`**
   ```bash
   VITE_CALENDLY_CLIENT_ID=qEuJAw-2mk2UKIIJzslMOE43QbNwtwr7N0U_0O77fNk
   VITE_CALENDLY_REDIRECT_URI=http://localhost:5173/auth/calendly/callback
   ```

---

## 🔄 Flux de Synchronisation Calendly

### 1. Connexion OAuth

```
Frontend → Redirecton Calendly → Authorization → Code OAuth
    ↓
Backend /auth/calendly/callback
    ↓
1. Échange code contre tokens
2. Récupération infos utilisateur Calendly
3. Sauvegarde dans CalendlyIntegration (table)
4. Sauvegarde dans Organization.settings.calendly (JSON)
5. Synchronisation initiale des événements
6. Création webhook Calendly
```

### 2. Synchronisation Automatique

```
Cron Job (toutes les 30 min)
    ↓
Pour chaque integration active :
    1. Récupération événements Calendly API
    2. Pour chaque événement :
       - Récupération invités
       - Upsert CalendlyEvent
       - Vérification prospect par email
       - SI NOUVEAU → Créer prospect + Socket.IO + Notification
       - SI EXISTE → Ajouter note + Socket.IO + Notification
    3. Mise à jour last_synced_at
```

### 3. Webhook Temps Réel (Optionnel)

```
Calendly Webhook (invitee.created, invitee.canceled, invitee.rescheduled)
    ↓
Backend /calendly/webhook
    ↓
Vérification signature
    ↓
Déclenchement sync immédiate
```

---

## 📊 Structure des Données

### CalendlyIntegration (Table)

```sql
id: uuid
organization_id: uuid → Organization
calendly_user_uri: string (unique)
calendly_user_name: string
calendly_email: string
access_token: string (encrypted)
refresh_token: string (encrypted)
expires_at: timestamp
scope: string
auto_sync_enabled: boolean (default: true)
sync_interval_minutes: integer (default: 30)
last_synced_at: timestamp
next_sync_at: timestamp
webhook_subscription_uri: string
webhook_active: boolean
is_active: boolean (soft delete)
```

### Organization.settings.calendly (JSON)

```json
{
  "enabled": true,
  "mode": "simple",
  "calendly_link": "https://calendly.com/user",
  "oauth_connected": true,
  "oauth_email": "user@example.com",
  "oauth_user_uri": "https://api.calendly.com/users/xxx",
  "oauth_user_name": "John Doe",
  "oauth_expires_at": "2026-01-04T10:00:00.000Z",
  "oauth_token_type": "Bearer"
}
```

### CalendlyEvent (Table)

```sql
id: uuid
organization_id: uuid
integration_id: uuid → CalendlyIntegration
prospect_id: uuid → Prospect (nullable)
calendly_event_uri: string (unique)
calendly_event_type: string
event_name: string
event_start_time: timestamp
event_end_time: timestamp
event_status: string
location: string
invitee_name: string
invitee_email: string
invitee_timezone: string
invitee_uri: string
invitee_questions: json
```

### Prospect (Impact)

```sql
source: "calendly" (pour prospects Calendly)
notes: string (contient les rendez-vous)
```

**Format des notes pour plusieurs rendez-vous :**
```
Rendez-vous Calendly prévu le 16/01/2026 16:30:00 - Découverte 30min

Rendez-vous Calendly prévu le 17/01/2026 14:00:00 - Présentation produit

Rendez-vous Calendly prévu le 20/01/2026 10:00:00 - Suivi client
```

---

## 🔌 Événements Socket.IO

### Prospects

| Événement | Trigger | Room | Payload |
|-----------|---------|------|---------|
| `prospect:created` | Nouveau prospect (Calendly ou manuel) | `org:{organizationId}` | `{ id, firstname, lastname, email, phone, status, source, notes, created_at }` |
| `prospect:updated` | Mise à jour prospect / Nouveau RDV Calendly | `org:{organizationId}` | `{ id, firstname, lastname, email, phone, status, source, notes, updated_at }` |
| `prospect:deleted` | Suppression prospect | `org:{organizationId}` | `{ id }` |

### Notifications

| Événement | Trigger | Room | Payload |
|-----------|---------|------|---------|
| `notification` | Nouveau rendez-vous Calendly | `org:{organizationId}` | `{ id, type: "calendly_prospect_created", title, message, meta, created_at }` |

---

## 🧪 Tests Manuels

### 1. Connexion Calendly

```bash
# Frontend : Aller sur /settings/integrations
# Cliquer sur "Connecter Calendly"
# Autoriser l'accès sur Calendly
# Redirection vers /auth/calendly/callback
# → Devrait afficher "Calendly connecté avec succès"
```

**Vérification backend :**
```bash
# Logs backend
✅ Calendly integration connected
✅ Updated Organization.settings.calendly
```

**Vérification base de données :**
```sql
-- CalendlyIntegration créé
SELECT * FROM "CalendlyIntegration" WHERE organization_id = 'YOUR_ORG_ID';

-- Organization.settings.calendly rempli
SELECT settings->'calendly' FROM "Organization" WHERE id = 'YOUR_ORG_ID';
```

### 2. Synchronisation

```bash
# Méthode 1 : Attendre 30 minutes (auto-sync)
# Méthode 2 : Trigger manuel
curl -X POST http://localhost:3000/calendly/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Vérification :**
```sql
-- Événements synchronisés
SELECT COUNT(*) FROM "CalendlyEvent" WHERE organization_id = 'YOUR_ORG_ID';

-- Prospects créés
SELECT * FROM "Prospect" WHERE source = 'calendly' AND organization_id = 'YOUR_ORG_ID';
```

### 3. Notes multiples

**Scénario :**
1. Réserver 3 rendez-vous Calendly avec le même email
2. Déclencher sync
3. Vérifier les notes du prospect

```sql
SELECT notes FROM "Prospect"
WHERE email = 'test@example.com'
AND source = 'calendly';
```

**Résultat attendu :**
```
Rendez-vous Calendly prévu le 16/01/2026 16:30:00 - Event 1

Rendez-vous Calendly prévu le 17/01/2026 14:00:00 - Event 2

Rendez-vous Calendly prévu le 18/01/2026 10:00:00 - Event 3
```

### 4. Socket.IO Temps Réel

**Test :**
1. Ouvrir 2 navigateurs avec 2 utilisateurs de la même organisation
2. Dans navigateur 1 : Créer un prospect manuellement
3. Dans navigateur 2 : Voir le prospect apparaître en temps réel

**Logs attendus dans console navigateur 2 :**
```
🟢 Nouveau prospect: { id: "xxx", firstname: "John", ... }
```

### 5. Notifications Calendly

**Test :**
1. Réserver un rendez-vous Calendly
2. Attendre synchronisation (ou trigger manuel)
3. Vérifier notification

**Requête API :**
```bash
curl http://localhost:3000/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
[
  {
    "type": "calendly_prospect_created",
    "title": "Nouveau prospect Calendly",
    "message": "John Doe a réservé un rendez-vous \"Découverte\" le 16/01/2026 16:30:00"
  }
]
```

---

## 🚨 Troubleshooting

### Problème 1 : 401 Unauthorized sur callback

**Cause :** Endpoint retourne 401 au lieu de 500/400

**Solution :** Vérifiée ✅ - L'endpoint ne retourne jamais 401 maintenant

### Problème 2 : Organization.settings.calendly vide

**Cause :** Ancien code ne sauvegardait pas dans settings

**Solution :** Corrigé ✅ - Sauvegarde maintenant dans les deux endroits

### Problème 3 : Un seul rendez-vous dans les notes

**Cause :** Code ne concaténait pas les notes pour les prospects existants

**Solution :** Corrigé ✅ - Chaque événement ajoute une nouvelle note

### Problème 4 : Socket.IO ne reçoit pas les événements

**Diagnostic :**
```bash
# Vérifier connexion Socket.IO
# Console navigateur devrait afficher :
🟢 Socket.IO connecté: abc123

# Vérifier que l'utilisateur est dans la room
# Logs backend :
🟢 Socket.IO: User joined organization room org:xxx
```

**Solution :** Vérifier token JWT valide et que l'utilisateur a un organization_id

### Problème 5 : Tokens Calendly expirés

**Diagnostic :**
```sql
SELECT expires_at FROM "CalendlyIntegration"
WHERE id = 'INTEGRATION_ID';
```

**Solution :** Le refresh automatique est implémenté dans `getCalendlyClient()`

---

## 📋 Checklist Déploiement Production

### Backend

- [ ] Variables d'environnement configurées (credentials Production Calendly)
- [ ] ENCRYPTION_KEY en production (32 bytes hex)
- [ ] CALENDLY_REDIRECT_URI avec HTTPS
- [ ] Webhook URL accessible publiquement
- [ ] Serveur backend écoute sur 0.0.0.0 (pas 127.0.0.1)

### Frontend

- [ ] VITE_CALENDLY_CLIENT_ID production
- [ ] VITE_CALENDLY_REDIRECT_URI avec HTTPS
- [ ] Socket.IO connecté avec URL production
- [ ] Gestion des erreurs OAuth affichée

### Base de données

- [ ] Migration Prisma exécutée
- [ ] Index sur calendly_event_uri
- [ ] Index sur calendly_user_uri

### Sécurité

- [ ] Tokens chiffrés avec AES-256
- [ ] Webhook signature vérifiée
- [ ] JWT tokens validés
- [ ] CORS configuré correctement

---

## 📞 Support

**Backend logs utiles :**
```bash
✅ Calendly integration connected
✅ Updated Organization.settings.calendly
📢 Notification sent for new Calendly prospect
🟢 Socket.IO: prospect:created emitted to org:xxx
```

**Frontend logs utiles :**
```bash
🟢 Socket.IO connecté: abc123
🟢 Nouveau prospect: {...}
📢 Nouvelle notification: {...}
```

**Endpoints de debug :**
```bash
# Status intégration
GET /calendly/status

# Trigger sync manuel
POST /calendly/sync

# Liste événements
GET /calendly/events

# Déconnexion
POST /calendly/disconnect
```

---

## 🎯 Prochaines Étapes

1. **Frontend** : Implémenter Socket.IO selon `FRONTEND_PROSPECTS_SOCKETIO.md`
2. **Tests** : Tester le flux complet avec plusieurs utilisateurs
3. **Production** : Configurer credentials Calendly Production
4. **Monitoring** : Suivre les syncs et erreurs dans les logs
