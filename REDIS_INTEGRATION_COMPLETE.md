# ✅ Intégration Redis pour Account Deletion - TERMINÉE

**Date** : 2025-12-19
**Status** : ✅ PRODUCTION READY

---

## 🎯 Objectif

Migrer le système de suppression de compte depuis un `Map` en mémoire vers **Redis** pour garantir la persistence et le support multi-instance en production.

---

## ✅ Ce qui a été fait

### 1. **Installation de ioredis**

```bash
npm install ioredis @types/ioredis
```

✅ Package installé avec succès

---

### 2. **Création du client Redis**

**Fichier** : `src/lib/redis.ts`

**Features** :
- ✅ Singleton Redis avec gestion d'erreurs
- ✅ Reconnexion automatique avec backoff exponentiel
- ✅ Events handlers (connect, ready, error, close, reconnecting)
- ✅ Fonction `getRedisClient()` pour obtenir l'instance
- ✅ Fonction `closeRedis()` pour shutdown propre
- ✅ Fonction `isRedisAvailable()` pour health check

**Configuration** :
```typescript
const client = new Redis(redisUrl, {
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});
```

---

### 3. **Migration de accountDeletionService.ts**

**Changements** :

#### Avant (Map en mémoire)
```typescript
const deletionRequests = new Map<string, DeletionRequest>();

// Stockage
deletionRequests.set(organizationId, request);

// Lecture
const request = deletionRequests.get(organizationId);

// Suppression
deletionRequests.delete(organizationId);
```

#### Après (Redis avec fallback)
```typescript
// 3 nouvelles fonctions
async function saveDeletionRequest(organizationId, request): Promise<void>
async function getDeletionRequest(organizationId): Promise<DeletionRequest | null>
async function deleteDeletionRequest(organizationId): Promise<void>

// Utilisation
await saveDeletionRequest(organizationId, request);
const request = await getDeletionRequest(organizationId);
await deleteDeletionRequest(organizationId);
```

**Features** :
- ✅ **TTL automatique** : Redis expire automatiquement les codes (30 min managers, 24h admins)
- ✅ **Fallback Map** : Si Redis est indisponible, fallback sur Map en mémoire
- ✅ **Sérialisation JSON** : Stockage et récupération avec reconversion des dates
- ✅ **Prefix Redis** : `account_deletion:{organizationId}`

---

### 4. **Configuration .env**

**Ajouté** :
```env
# Redis Configuration
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@127.0.0.1:6379
```

**⚠️ IMPORTANT** : En production, utiliser le mot de passe Redis défini dans `docker-compose.yml` :
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

---

### 5. **Compilation réussie**

```bash
npm run build
```

✅ Aucune erreur TypeScript
✅ Tous les types corrects
✅ Build réussi

---

## 🏗️ Architecture Redis

### Clés Redis utilisées

```
account_deletion:{organizationId}
```

**Exemple** :
```
account_deletion:550e8400-e29b-41d4-a716-446655440000
```

### Structure de la valeur (JSON)

```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "validationCode": "123456",
  "expiresAt": "2025-12-19T15:30:00.000Z",
  "requestedBy": "user-id-123",
  "requestedAt": "2025-12-19T15:00:00.000Z",
  "userRole": "manager"
}
```

### TTL (Time To Live)

- **Managers** : 30 minutes (1800 secondes)
- **Admins** : 24 heures (86400 secondes)

**Avantage** : Redis expire automatiquement, pas besoin de nettoyage manuel !

---

## 🔐 Sécurité

### 1. **Isolation par organization**

Chaque demande de suppression est stockée avec l'`organizationId` comme clé, garantissant l'isolation multi-tenant.

### 2. **Expiration automatique**

Redis supprime automatiquement les codes expirés grâce au TTL.

### 3. **Validation stricte**

- ✅ **Managers** : Code à 6 chiffres envoyé à l'email de l'organisation
- ✅ **Admins** : Code spécial "ADMIN_BYPASS" avec validity de 24h

---

## 🚀 Déploiement en Production

### 1. **Vérifier que Redis tourne**

```bash
docker ps | grep redis
# Devrait afficher: velvena-redis (healthy)
```

### 2. **Configurer REDIS_URL**

Dans le fichier `.env` de production :
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

**Note** : `${REDIS_PASSWORD}` est défini dans le docker-compose.yml

### 3. **Redémarrer l'API**

```bash
docker-compose restart api
```

### 4. **Vérifier les logs**

```bash
docker-compose logs -f api | grep Redis
```

Vous devriez voir :
```
✅ Redis connecté
🚀 Redis prêt
```

---

## 🧪 Test Manuel

### 1. **Demande de suppression (Manager)**

```bash
curl -X POST http://localhost:3000/account/request-deletion \
  -H "Authorization: Bearer <MANAGER_TOKEN>" \
  -H "Content-Type: application/json"
```

**Résultat** :
```json
{
  "success": true,
  "message": "Validation code sent to organization email...",
  "expiresAt": "2025-12-19T15:30:00.000Z"
}
```

### 2. **Vérifier dans Redis**

```bash
docker exec -it velvena-redis redis-cli -a ${REDIS_PASSWORD}

# Dans redis-cli
KEYS account_deletion:*
# Devrait afficher: account_deletion:{organizationId}

GET account_deletion:{organizationId}
# Devrait afficher le JSON de la demande

TTL account_deletion:{organizationId}
# Devrait afficher le temps restant en secondes (max 1800 pour manager)
```

### 3. **Confirmation de suppression**

```bash
curl -X POST http://localhost:3000/account/confirm-deletion \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"validationCode": "123456"}'
```

### 4. **Vérifier suppression de Redis**

```bash
# Dans redis-cli
GET account_deletion:{organizationId}
# Devrait afficher: (nil)
```

---

## 📊 Monitoring

### Métriques Redis à surveiller

1. **Nombre de clés actives**
   ```bash
   redis-cli DBSIZE
   ```

2. **Mémoire utilisée**
   ```bash
   redis-cli INFO memory
   ```

3. **Connexions actives**
   ```bash
   redis-cli INFO clients
   ```

4. **Keys account_deletion**
   ```bash
   redis-cli KEYS account_deletion:* | wc -l
   ```

---

## 🐛 Troubleshooting

### Problème : "REDIS_URL not configured"

**Solution** : Vérifier que `.env` contient :
```env
REDIS_URL=redis://:PASSWORD@127.0.0.1:6379
```

### Problème : "Connection refused"

**Solution** :
```bash
# Vérifier que Redis tourne
docker ps | grep redis

# Redémarrer Redis
docker-compose restart redis
```

### Problème : "Authentication failed"

**Solution** : Vérifier que le mot de passe dans `REDIS_URL` correspond à `REDIS_PASSWORD` dans docker-compose.yml

### Problème : Fallback sur Map en mémoire

**Logs** :
```
⚠️ REDIS_URL non défini, Redis désactivé (utilisation du fallback Map en mémoire)
❌ Erreur sauvegarde Redis, fallback sur Map en mémoire
```

**Solution** : Redis est indisponible, le système utilise le fallback. Vérifier la connexion Redis.

---

## ✅ Checklist de Production

- [x] ioredis installé
- [x] src/lib/redis.ts créé
- [x] accountDeletionService migré vers Redis
- [x] Fallback Map en mémoire implémenté
- [x] REDIS_URL configuré dans .env
- [x] Build TypeScript réussi
- [x] **Tests manuels en production**
- [x] **Déploiement en production**
- [x] **Tests en production validés**
- [ ] **Monitoring Redis activé**

---

## 🧪 Tests en Production (2025-12-20)

### Environnement
- **VPS** : ubuntu-8gb-hel1-1
- **Redis** : 7.4-alpine (container velvena-redis)
- **API** : Node.js 23.11.0-alpine
- **SMTP** : Gandi (mail.gandi.net:587)

### Tests Effectués

#### 1. ✅ Connexion Redis
- **Problème initial** : Mot de passe avec caractères spéciaux (`/` et `=`)
- **Solution** : URL-encoding du mot de passe → `%2F` et `%3D`
- **Config** : `REDIS_PASSWORD_ENCODED` dans `.env`
- **Résultat** : ✅ Connexion réussie

#### 2. ✅ Sauvegarde dans Redis
- **Test** : Demande de suppression MANAGER
- **Logs** : `"✅ Demande de suppression sauvegardée dans Redis"`
- **TTL** : 1800 secondes (30 minutes) ✅
- **Clé** : `account_deletion:{organizationId}` ✅
- **Résultat** : ✅ Données sauvegardées correctement

#### 3. ✅ Envoi d'Email avec Code
- **Problème initial** : Erreur `EENVELOPE` - "Not allowed to take this identity"
- **Cause** : Variable `SMTP_FROM` manquante dans docker-compose.yml
- **Solution** : Ajout de `SMTP_FROM: ${SMTP_FROM}` dans docker-compose.yml
- **Résultat** : ✅ Email reçu avec code à 6 chiffres

#### 4. ✅ Confirmation de Suppression
- **Test** : Validation du code à 6 chiffres
- **Résultat** : ✅ Suppression confirmée

#### 5. ✅ Suppression de la Clé Redis
- **Vérification** : Clé Redis supprimée après confirmation
- **Résultat** : ✅ Cleanup automatique validé

### Modifications Apportées

#### Dockerfile
```dockerfile
# Ligne 64-65 : Création du dossier temp pour exports
RUN mkdir -p /app/uploads /app/temp/exports && \
    chown -R nodejs:nodejs /app/uploads /app/temp
```

#### docker-compose.yml
```yaml
# Section api.environment : Ajout de SMTP_FROM
SMTP_FROM: ${SMTP_FROM}
```

#### .env (Production)
```bash
# Redis avec mot de passe URL-encodé
REDIS_PASSWORD_ENCODED=xQzJgVrLUhYl7nvNcf1X8gCmyINj6W%2FqkKsbFpu7f9E%3D

# SMTP Gandi
SMTP_HOST=mail.gandi.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@velvena.fr
SMTP_PASS=***
SMTP_FROM=contact@velvena.fr
```

### Conclusion

**✅ Redis pour Account Deletion est 100% opérationnel en production !**

- Connexion stable avec reconnexion automatique
- Sauvegarde et récupération de données
- TTL automatique fonctionnel
- Intégration complète avec le flow d'email
- Suppression automatique des clés

---

## 📝 Prochaines Étapes (Account Deletion Production Ready)

Selon `ACCOUNT_DELETION_PRODUCTION_READY.md` :

### 1. ✅ Redis (TERMINÉ)
- [x] Installation ioredis
- [x] Client Redis singleton
- [x] Migration account deletion
- [x] Fallback Map

### 2. ⏳ Audit Logging (À FAIRE)
- [ ] Créer table AuditLog dans Prisma
- [ ] Logger toutes les suppressions
- [ ] Logger tentatives de validation
- [ ] Rétention 7 ans

### 3. ⏳ Rate Limiting (À FAIRE)
- [ ] 3 demandes de suppression max/jour
- [ ] 5 tentatives de validation max/heure
- [ ] Implémentation avec Redis

### 4. ⏳ Monitoring (À FAIRE)
- [ ] Métriques Prometheus
- [ ] Alertes Slack
- [ ] Dashboard Grafana

### 5. ⏳ Backup avant suppression (À FAIRE)
- [ ] Backup automatique avant chaque suppression
- [ ] Rétention 30 jours
- [ ] Script de restauration

### 6. ⏳ Tests (À FAIRE)
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E

---

**Auteur** : Claude Code
**Date** : 2025-12-19
**Version** : 1.0.0
**Status** : ✅ PRODUCTION READY (Redis seulement)
