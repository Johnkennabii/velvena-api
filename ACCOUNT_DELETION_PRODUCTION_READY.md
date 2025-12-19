# 🚀 Account Deletion - Production Ready Checklist

## ⚠️ Problèmes Critiques Actuels

### 1. 🔴 CRITIQUE : Stockage en mémoire (Map)

**Problème actuel** :
```typescript
const deletionRequests = new Map<string, DeletionRequest>();
```

**Pourquoi c'est problématique** :
- ❌ Les codes de validation sont perdus au redémarrage du serveur
- ❌ Ne fonctionne pas en multi-instance (load balancer)
- ❌ Pas de persistance
- ❌ Pas de TTL automatique

**Solution** : Utiliser **Redis**

```typescript
// Avant (Map en mémoire)
deletionRequests.set(organizationId, {
  validationCode: "123456",
  expiresAt: new Date(),
  // ...
});

// Après (Redis)
await redis.setex(
  `deletion_request:${organizationId}`,
  1800, // 30 minutes en secondes
  JSON.stringify({
    validationCode: "123456",
    requestedBy: userId,
    requestedAt: new Date().toISOString(),
    userRole: "manager"
  })
);
```

---

## 📋 Plan de Migration vers Redis

### Étape 1 : Installation

```bash
npm install ioredis
npm install -D @types/ioredis
```

### Étape 2 : Configuration Redis

**Fichier** : `src/lib/redis.ts`

```typescript
import Redis from 'ioredis';
import pino from './logger.js';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  pino.info('✅ Redis connected');
});

redis.on('error', (err) => {
  pino.error({ err }, '❌ Redis connection error');
});

export default redis;
```

**Variables d'environnement** :
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
```

### Étape 3 : Adapter le Code

**Fichier** : `src/services/accountDeletionService.ts`

```typescript
import redis from '../lib/redis.js';

// Clés Redis
const DELETION_REQUEST_PREFIX = 'deletion_request:';
const DELETION_REQUEST_TTL = 1800; // 30 minutes

// Stocker une demande
async function storeDeletionRequest(
  organizationId: string,
  data: {
    validationCode: string;
    requestedBy: string;
    userRole: string;
  }
): Promise<void> {
  const key = `${DELETION_REQUEST_PREFIX}${organizationId}`;

  await redis.setex(
    key,
    DELETION_REQUEST_TTL,
    JSON.stringify({
      ...data,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + DELETION_REQUEST_TTL * 1000).toISOString(),
    })
  );
}

// Récupérer une demande
async function getDeletionRequest(
  organizationId: string
): Promise<DeletionRequest | null> {
  const key = `${DELETION_REQUEST_PREFIX}${organizationId}`;
  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

// Supprimer une demande
async function deleteDeletionRequest(
  organizationId: string
): Promise<void> {
  const key = `${DELETION_REQUEST_PREFIX}${organizationId}`;
  await redis.del(key);
}
```

---

## 🔐 Sécurité & Audit

### 1. Logging Complet

**Créer un fichier de logs dédié** : `account_deletions.log`

```typescript
import pino from 'pino';

const auditLogger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: {
          destination: './logs/account_deletions.log',
          mkdir: true,
        },
      },
      {
        target: 'pino-pretty',
        options: { destination: 1 }, // stdout
      },
    ],
  },
});

// Utilisation
auditLogger.info({
  event: 'DELETION_REQUESTED',
  organizationId,
  requestedBy: userId,
  userRole,
  userEmail,
  timestamp: new Date().toISOString(),
  ip: req.ip,
  userAgent: req.headers['user-agent'],
}, '🗑️ Account deletion requested');
```

### 2. Événements à Logger

```typescript
// Types d'événements
enum DeletionEvent {
  DELETION_REQUESTED = 'DELETION_REQUESTED',
  VALIDATION_CODE_SENT = 'VALIDATION_CODE_SENT',
  VALIDATION_CODE_FAILED = 'VALIDATION_CODE_FAILED',
  VALIDATION_CODE_EXPIRED = 'VALIDATION_CODE_EXPIRED',
  DELETION_CONFIRMED = 'DELETION_CONFIRMED',
  DELETION_COMPLETED = 'DELETION_COMPLETED',
  DELETION_FAILED = 'DELETION_FAILED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_FAILED = 'EMAIL_FAILED',
}

// Structure de log
interface DeletionAuditLog {
  event: DeletionEvent;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  userEmail: string;
  userRole: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  metadata?: {
    validationCode?: string; // Hashé, jamais en clair
    exportFileSize?: number;
    deletedData?: {
      users: number;
      dresses: number;
      customers: number;
      prospects: number;
      contracts: number;
    };
    error?: string;
  };
}
```

### 3. Table d'Audit en Base de Données

**Schéma Prisma** :

```prisma
model AccountDeletionAudit {
  id              String   @id @default(uuid())
  organization_id String
  event_type      String   // DELETION_REQUESTED, DELETION_COMPLETED, etc.
  requested_by    String   // User ID
  user_email      String
  user_role       String
  ip_address      String?
  user_agent      String?
  metadata        Json?    // Données supplémentaires
  created_at      DateTime @default(now())

  @@index([organization_id])
  @@index([created_at])
  @@index([event_type])
  @@map("AccountDeletionAudit")
}
```

**Migration** :
```bash
npx prisma migrate dev --name add_account_deletion_audit
```

**Utilisation** :

```typescript
async function logDeletionEvent(data: DeletionAuditLog): Promise<void> {
  await Promise.all([
    // Log fichier
    auditLogger.info(data),

    // Log base de données
    prisma.accountDeletionAudit.create({
      data: {
        organization_id: data.organizationId,
        event_type: data.event,
        requested_by: data.requestedBy,
        user_email: data.userEmail,
        user_role: data.userRole,
        ip_address: data.ip,
        user_agent: data.userAgent,
        metadata: data.metadata || {},
      },
    }),
  ]);
}
```

---

## 🔒 Sécurité Renforcée

### 1. Rate Limiting

**Limiter les tentatives de suppression** :

```typescript
import rateLimit from 'express-rate-limit';

// Max 3 demandes par jour par organisation
const deletionRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 heures
  max: 3,
  keyGenerator: (req) => {
    return (req as any).user?.organizationId || req.ip;
  },
  message: {
    success: false,
    error: 'Trop de demandes de suppression. Réessayez dans 24h.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer au endpoint
router.post(
  '/request-deletion',
  authMiddleware,
  deletionRequestLimiter,
  (req, res) => { /* ... */ }
);

// Max 5 tentatives de validation par heure
const deletionConfirmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  keyGenerator: (req) => {
    return (req as any).user?.organizationId || req.ip;
  },
  message: {
    success: false,
    error: 'Trop de tentatives. Réessayez dans 1 heure.',
  },
});

router.post(
  '/confirm-deletion',
  authMiddleware,
  deletionConfirmLimiter,
  (req, res) => { /* ... */ }
);
```

### 2. Vérification 2FA (Optionnel mais Recommandé)

```typescript
// Avant de permettre la suppression, vérifier 2FA si activé
if (user.twoFactorEnabled) {
  const { twoFactorCode } = req.body;

  const isValid = await verifyTwoFactorCode(user.id, twoFactorCode);

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: '2FA code invalide',
    });
  }
}
```

### 3. Notification Multi-Canal

```typescript
// Envoyer des notifications par plusieurs canaux
async function notifyDeletionRequest(
  organizationId: string,
  userEmail: string
): Promise<void> {
  await Promise.all([
    // Email principal
    sendDeletionValidationEmail(userEmail, ...),

    // Email de backup (si configuré)
    organization.backup_email &&
      sendDeletionNotification(organization.backup_email, ...),

    // SMS (si configuré)
    organization.phone &&
      sendSMS(organization.phone, 'Code de suppression: ...'),

    // Webhook (si configuré)
    organization.webhook_url &&
      sendWebhook(organization.webhook_url, { event: 'deletion_requested' }),
  ]);
}
```

---

## 📊 Monitoring & Alertes

### 1. Métriques à Tracker

```typescript
// Prometheus metrics
import { Counter, Histogram } from 'prom-client';

const deletionRequestCounter = new Counter({
  name: 'account_deletion_requests_total',
  help: 'Total number of account deletion requests',
  labelNames: ['status', 'role'],
});

const deletionDuration = new Histogram({
  name: 'account_deletion_duration_seconds',
  help: 'Duration of account deletion process',
  buckets: [1, 5, 10, 30, 60, 120, 300],
});

// Utilisation
deletionRequestCounter.inc({ status: 'success', role: 'manager' });

const timer = deletionDuration.startTimer();
// ... processus de suppression
timer();
```

### 2. Alertes Critiques

**Slack/Discord Webhook** :

```typescript
async function sendCriticalAlert(message: string, data: any): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ALERTE SUPPRESSION DE COMPTE`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Organisation:*\n${data.organizationName}` },
            { type: 'mrkdwn', text: `*ID:*\n${data.organizationId}` },
            { type: 'mrkdwn', text: `*User:*\n${data.userEmail}` },
            { type: 'mrkdwn', text: `*Role:*\n${data.userRole}` },
          ],
        },
      ],
    }),
  });
}

// Utilisation
await sendCriticalAlert(
  'Suppression de compte confirmée',
  { organizationId, organizationName, userEmail, userRole }
);
```

---

## 🗄️ Backup & Récupération

### 1. Backup Automatique Avant Suppression

```typescript
async function createBackupBeforeDeletion(
  organizationId: string
): Promise<string> {
  const timestamp = Date.now();
  const backupPath = `/backups/org_${organizationId}_${timestamp}.sql`;

  // Backup PostgreSQL
  await exec(`pg_dump \
    -h ${process.env.DB_HOST} \
    -U ${process.env.DB_USER} \
    -d ${process.env.DB_NAME} \
    -t "Organization" \
    -t "User" \
    -t "Dress" \
    -t "Contract" \
    --where="organization_id='${organizationId}'" \
    > ${backupPath}`);

  // Compresser
  await exec(`gzip ${backupPath}`);

  // Upload vers S3
  await uploadToS3(
    `${backupPath}.gz`,
    `backups/deleted-orgs/org_${organizationId}_${timestamp}.sql.gz`
  );

  return `org_${organizationId}_${timestamp}.sql.gz`;
}
```

### 2. Période de Rétention

```typescript
// Supprimer SOFT pendant 30 jours avant HARD delete
async function softDeleteOrganization(organizationId: string): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      deleted_at: new Date(),
      // Marquer pour suppression définitive dans 30 jours
      hard_delete_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

// Cron job pour nettoyer les organisations expirées
// Tous les jours à 3h du matin
cron.schedule('0 3 * * *', async () => {
  const orgsToDelete = await prisma.organization.findMany({
    where: {
      hard_delete_at: {
        lte: new Date(),
      },
    },
  });

  for (const org of orgsToDelete) {
    await hardDeleteOrganization(org.id);
  }
});
```

---

## 🧪 Tests

### 1. Tests Unitaires

```typescript
// __tests__/accountDeletion.test.ts

describe('Account Deletion Service', () => {
  describe('Request Deletion', () => {
    it('should create deletion request for MANAGER', async () => {
      const result = await requestAccountDeletion(orgId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Code de validation envoyé');

      // Vérifier Redis
      const request = await redis.get(`deletion_request:${orgId}`);
      expect(request).toBeTruthy();
    });

    it('should bypass validation for ADMIN', async () => {
      const result = await requestAccountDeletion(orgId, adminUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Admin');

      const request = await redis.get(`deletion_request:${orgId}`);
      const data = JSON.parse(request);
      expect(data.validationCode).toBe('ADMIN_BYPASS');
    });

    it('should reject for COLLABORATOR', async () => {
      const result = await requestAccountDeletion(orgId, collabUserId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('managers and admins');
    });
  });

  describe('Confirm Deletion', () => {
    it('should delete organization with valid code', async () => {
      // Setup
      await requestAccountDeletion(orgId, userId);
      const request = await redis.get(`deletion_request:${orgId}`);
      const { validationCode } = JSON.parse(request);

      // Confirm
      const result = await confirmAccountDeletion(orgId, validationCode, userId);

      expect(result.success).toBe(true);
      expect(result.deletedData).toBeDefined();

      // Vérifier suppression
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });
      expect(org).toBeNull();
    });

    it('should reject invalid code', async () => {
      await requestAccountDeletion(orgId, userId);

      const result = await confirmAccountDeletion(orgId, '000000', userId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should reject expired code', async () => {
      // Mock expired request
      await redis.setex(
        `deletion_request:${orgId}`,
        1, // 1 seconde
        JSON.stringify({ validationCode: '123456', expiresAt: new Date() })
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await confirmAccountDeletion(orgId, '123456', userId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
    });
  });
});
```

### 2. Tests d'Intégration

```typescript
describe('Account Deletion E2E', () => {
  it('should complete full deletion flow', async () => {
    // 1. Créer organisation
    const org = await createTestOrganization();

    // 2. Ajouter des données
    await createTestDresses(org.id, 5);
    await createTestContracts(org.id, 3);

    // 3. Demander suppression
    const requestRes = await request(app)
      .post('/account/request-deletion')
      .set('Authorization', `Bearer ${managerToken}`)
      .send();

    expect(requestRes.status).toBe(200);

    // 4. Récupérer code depuis Redis
    const reqData = await redis.get(`deletion_request:${org.id}`);
    const { validationCode } = JSON.parse(reqData);

    // 5. Confirmer suppression
    const confirmRes = await request(app)
      .post('/account/confirm-deletion')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ validationCode });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.deletedData.dresses).toBe(5);
    expect(confirmRes.body.deletedData.contracts).toBe(3);

    // 6. Vérifier suppression complète
    const deletedOrg = await prisma.organization.findUnique({
      where: { id: org.id },
    });
    expect(deletedOrg).toBeNull();
  });
});
```

---

## 📋 Checklist Production

### Infrastructure
- [ ] Redis installé et configuré
- [ ] Redis avec authentification
- [ ] Redis avec persistance (AOF ou RDB)
- [ ] Backup Redis quotidien
- [ ] Monitoring Redis (CPU, mémoire, connexions)

### Sécurité
- [ ] Rate limiting sur `/request-deletion` (3/jour)
- [ ] Rate limiting sur `/confirm-deletion` (5/heure)
- [ ] Validation 2FA (si activé)
- [ ] Logs d'audit complets
- [ ] Table `AccountDeletionAudit` créée
- [ ] Alertes Slack/Discord configurées
- [ ] HTTPS obligatoire

### Backup & Récupération
- [ ] Backup automatique avant suppression
- [ ] Upload backup vers S3
- [ ] Soft delete avec période de rétention (30 jours)
- [ ] Cron job de nettoyage configuré
- [ ] Procédure de récupération documentée

### Email & Notifications
- [ ] Templates email unifiés (✅ déjà fait)
- [ ] SMTP configuré et testé
- [ ] Email de validation fonctionnel
- [ ] Email de confirmation fonctionnel
- [ ] Notification multi-canal (backup email, SMS, webhook)

### Données
- [ ] Export ZIP complet testé
- [ ] Conformité RGPD vérifiée
- [ ] Toutes les tables supprimées (✅ déjà fait)
- [ ] Cascade delete vérifié
- [ ] Pas de données orphelines

### Monitoring
- [ ] Métriques Prometheus configurées
- [ ] Dashboard Grafana créé
- [ ] Alertes sur échecs de suppression
- [ ] Logs centralisés (ELK, Datadog, etc.)

### Tests
- [ ] Tests unitaires (couverture > 80%)
- [ ] Tests d'intégration
- [ ] Tests E2E
- [ ] Tests de charge
- [ ] Test de récupération après échec

### Documentation
- [ ] Guide utilisateur
- [ ] Guide admin
- [ ] Procédure d'urgence
- [ ] FAQ
- [ ] Changelog

---

## 🚀 Ordre de Déploiement

1. **Phase 1 - Infrastructure**
   - Installer Redis
   - Configurer backups
   - Créer table d'audit

2. **Phase 2 - Code**
   - Migrer de Map vers Redis
   - Ajouter rate limiting
   - Ajouter logging complet

3. **Phase 3 - Tests**
   - Tests unitaires
   - Tests d'intégration
   - Tests de charge

4. **Phase 4 - Monitoring**
   - Configurer métriques
   - Créer dashboards
   - Configurer alertes

5. **Phase 5 - Déploiement**
   - Staging d'abord
   - Tester en staging 1 semaine
   - Production avec feature flag
   - Rollout progressif

---

## 🔧 Configuration Recommandée

### Redis Production

```yaml
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

### Variables d'Environnement

```env
# Redis
REDIS_HOST=redis.production.example.com
REDIS_PORT=6379
REDIS_PASSWORD=strong_password_here
REDIS_DB=0
REDIS_TLS=true

# Alertes
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx

# Rate Limiting
DELETION_REQUEST_RATE_LIMIT=3
DELETION_CONFIRM_RATE_LIMIT=5

# Backup
BACKUP_S3_BUCKET=velvena-backups
BACKUP_RETENTION_DAYS=90

# Soft Delete
SOFT_DELETE_RETENTION_DAYS=30
```

---

## 📞 Support & Urgence

### Procédure d'Urgence

Si une suppression accidentelle se produit :

1. **Immédiat (< 5 min)**
   - Vérifier les logs d'audit
   - Récupérer le backup depuis S3
   - Vérifier le soft delete (si < 30 jours)

2. **Court terme (< 1h)**
   - Restaurer depuis backup
   - Notifier l'utilisateur
   - Analyser la cause

3. **Moyen terme (< 24h)**
   - Corriger le bug
   - Déployer le fix
   - Post-mortem

---

**Dernière mise à jour** : 2025-12-19
**Version** : 1.0
**Status** : 📋 CHECKLIST
