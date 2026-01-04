# 🔔 Configuration des Webhooks Calendly

## 📋 Vue d'ensemble

Le système Velvena utilise maintenant les **webhooks Calendly** pour une synchronisation **en temps réel** des rendez-vous, remplaçant l'ancien système de polling toutes les 30 minutes.

### ✅ Avantages

- **Temps réel** : Les prospects apparaissent instantanément après la prise de rendez-vous
- **Moins d'appels API** : Calendly push au lieu de pull périodique
- **Plus scalable** : Pas de cron job qui tourne en continu
- **Socket.IO** : Le frontend est notifié en temps réel via WebSocket

---

## 🏗️ Architecture

```
Calendly Event (invitee.created/canceled/rescheduled)
    ↓
POST https://api.velvena.fr/calendly/webhook
    ↓
Backend vérifie la signature Calendly (sécurité)
    ↓
Traite l'événement directement (pas d'appel API)
    ↓
Créé/Met à jour le prospect + ProspectNote
    ↓
Socket.IO émet l'événement au frontend
    ↓
Frontend affiche le nouveau prospect instantanément
```

---

## 🔧 Configuration Calendly

### 1️⃣ Variables d'environnement requises

Ajouter dans `.env` :

```bash
# Calendly OAuth
CALENDLY_CLIENT_ID=your_client_id_here
CALENDLY_CLIENT_SECRET=your_client_secret_here
CALENDLY_REDIRECT_URI=https://api.velvena.fr/auth/calendly/callback
CALENDLY_ENVIRONMENT=production

# Calendly Webhook Signing Key (pour vérifier les signatures)
CALENDLY_WEBHOOK_SIGNING_KEY=your_webhook_signing_key_here

# URL publique de l'API
APP_URL=https://api.velvena.fr
```

### 2️⃣ Créer le webhook dans Calendly Dashboard

1. Aller sur [Calendly Webhooks Settings](https://calendly.com/integrations/api_webhooks)
2. Cliquer sur **"Create Webhook"**
3. Configurer :
   - **Webhook URL** : `https://api.velvena.fr/calendly/webhook`
   - **Events** :
     - ✅ `invitee.created`
     - ✅ `invitee.canceled`
     - ✅ `invitee.rescheduled` (optionnel)
   - **Signing Key** : Copier la clé générée et la mettre dans `CALENDLY_WEBHOOK_SIGNING_KEY`
4. Cliquer sur **"Create Webhook"**

### 3️⃣ Tester le webhook

```bash
# Test avec curl (remplacer YOUR_SIGNING_KEY)
curl -X POST https://api.velvena.fr/calendly/webhook \
  -H "Content-Type: application/json" \
  -H "Calendly-Webhook-Signature: YOUR_SIGNATURE" \
  -d '{
    "event": "invitee.created",
    "payload": {
      "event": {
        "uri": "https://api.calendly.com/scheduled_events/test",
        "name": "30 Minute Meeting",
        "status": "active",
        "start_time": "2026-01-05T10:00:00Z",
        "end_time": "2026-01-05T10:30:00Z",
        "event_type": "https://api.calendly.com/event_types/test",
        "event_memberships": [
          {"user": "https://api.calendly.com/users/YOUR_USER_URI"}
        ]
      },
      "invitee": {
        "uri": "https://api.calendly.com/scheduled_events/test/invitees/test",
        "email": "test@example.com",
        "name": "John Doe",
        "timezone": "Europe/Paris"
      }
    }
  }'
```

---

## 🔍 Vérification du bon fonctionnement

### Backend Logs

Après avoir créé un rendez-vous Calendly, vérifier les logs :

```bash
# Sur le VPS
docker logs -f velvena-api

# Vous devriez voir :
# ✅ Received Calendly webhook event: invitee.created
# ✅ Processed Calendly webhook event successfully
# ✅ Created new prospect from Calendly event with note
# ✅ Socket.IO: User joined organization room org:xxx
```

### Frontend

1. Le prospect doit apparaître **instantanément** dans la liste
2. La note doit contenir : `Rendez-vous Calendly prévu le [DATE] - [EVENT_NAME]`

---

## 📝 Événements Calendly supportés

| Événement | Description | Action backend |
|-----------|-------------|----------------|
| `invitee.created` | Nouveau rendez-vous créé | Crée/met à jour prospect + note |
| `invitee.canceled` | Rendez-vous annulé | Marque l'événement comme `canceled` |
| `invitee.rescheduled` | Rendez-vous replanifié | Met à jour l'événement |

---

## 🛠️ Maintenance et Debugging

### Forcer un sync manuel

Si besoin de faire un sync complet (rare) :

```bash
POST /calendly/sync
Authorization: Bearer YOUR_JWT_TOKEN
```

### Vérifier le statut de l'intégration

```bash
GET /calendly/status
Authorization: Bearer YOUR_JWT_TOKEN
```

### Désactiver l'intégration

```bash
DELETE /calendly/disconnect
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Sécurité

### Vérification de signature

Tous les webhooks Calendly sont vérifiés avec HMAC-SHA256 :

```typescript
const expectedSignature = crypto
  .createHmac("sha256", process.env.CALENDLY_WEBHOOK_SIGNING_KEY!)
  .update(body)
  .digest("base64");

if (signature !== expectedSignature) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

Cela garantit que seuls les webhooks authentiques de Calendly sont acceptés.

---

## 🚨 Troubleshooting

### Problème : Le webhook ne fonctionne pas

**Vérifier :**
1. ✅ `CALENDLY_WEBHOOK_SIGNING_KEY` est bien configuré dans `.env`
2. ✅ L'URL `https://api.velvena.fr/calendly/webhook` est accessible publiquement
3. ✅ Aucun pare-feu ne bloque les requêtes de Calendly
4. ✅ Les logs backend ne montrent pas d'erreur 401 (Invalid signature)

**Solution :** Vérifier que la signing key dans `.env` correspond exactement à celle du dashboard Calendly.

### Problème : Le prospect n'apparaît pas en temps réel

**Vérifier :**
1. ✅ Le frontend est bien connecté au WebSocket Socket.IO
2. ✅ Les logs backend montrent `Socket.IO: User joined organization room`
3. ✅ L'événement Calendly a bien un email valide

**Solution :** Vérifier la console DevTools du frontend pour voir si les événements Socket.IO sont reçus.

### Problème : Doublon de prospects

**Cause :** L'ancien cron job tourne encore en même temps que les webhooks.

**Solution :** Vérifier que le scheduler ne lance plus `runCalendlySyncJob()` (déjà supprimé dans cette PR).

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (Cron) | Après (Webhook) |
|--------|--------------|-----------------|
| **Délai** | Jusqu'à 30 minutes | Instantané |
| **Appels API** | Polling toutes les 30 min | Uniquement quand événement |
| **Charge serveur** | Cron permanent | Événementiel |
| **Scalabilité** | Limitée | Excellente |
| **Frontend** | Refresh manuel | Temps réel via Socket.IO |

---

## ✅ Checklist de déploiement

- [ ] Variables `.env` configurées (CALENDLY_WEBHOOK_SIGNING_KEY, APP_URL)
- [ ] Webhook créé dans Calendly dashboard
- [ ] Backend redéployé avec les nouvelles modifications
- [ ] Test de création de rendez-vous Calendly
- [ ] Vérification logs backend (événement reçu et traité)
- [ ] Vérification frontend (prospect apparaît instantanément)
- [ ] Test d'annulation de rendez-vous
- [ ] Vérification que l'ancien cron ne tourne plus

---

## 📞 Support

En cas de problème, vérifier :
1. Les logs backend : `docker logs -f velvena-api`
2. Les logs Calendly : [Calendly Webhooks Dashboard](https://calendly.com/integrations/api_webhooks)
3. La console DevTools frontend (onglet Network → WS pour Socket.IO)

---

**Note :** Le cron job de synchronisation Calendly a été **complètement supprimé**. Seul le nettoyage des anciens événements (90+ jours) reste dans le scheduler quotidien.
