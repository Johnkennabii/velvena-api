# Système de Rappel d'Expiration d'Essai

## Vue d'ensemble

Le système de rappel d'expiration d'essai envoie automatiquement des emails aux utilisateurs dont la période d'essai gratuite de 14 jours arrive à expiration.

## Fonctionnement

### Déclenchement Automatique

Un job cron s'exécute **quotidiennement à 9h00 (Europe/Paris)** pour :

1. Rechercher toutes les organisations en période d'essai (`subscription_status: "trial"`)
2. Identifier celles dont l'essai expire dans **7, 3 ou 1 jour(s)**
3. Envoyer des emails de rappel aux utilisateurs **MANAGER** et **ADMIN** uniquement

### Tolérance Temporelle

Le système utilise une tolérance de **±12 heures** pour tenir compte des variations d'exécution du cron. Par exemple :
- Si un essai expire le 25/12/2025 à 14h00
- Le cron du 18/12/2025 à 9h00 (7 jours avant) enverra l'email même si ce n'est pas exactement 168 heures

### Contenu des Emails

Les emails sont personnalisés selon le nombre de jours restants :

#### 7 jours avant expiration
- **Emoji** : 📅
- **Couleur** : Bleu (#3b82f6)
- **Ton** : Informatif et encourageant
- **Sujet** : "📅 Votre essai Velvena se termine dans 7 jours"

#### 3 jours avant expiration
- **Emoji** : ⚡
- **Couleur** : Ambre (#f59e0b)
- **Ton** : Plus urgent
- **Sujet** : "⚡ Plus que 3 jours pour profiter de votre essai Velvena"

#### 1 jour avant expiration
- **Emoji** : 🚨
- **Couleur** : Rouge (#dc2626)
- **Ton** : Très urgent
- **Sujet** : "🚨 Dernière chance ! Votre essai Velvena se termine demain"

### Contenu Commun

Tous les emails incluent :
- Nom personnalisé de l'utilisateur
- Nom de l'organisation
- Date exacte de fin d'essai (formatée en français)
- Liste des fonctionnalités Velvena
- Bouton CTA "Choisir mon abonnement"
- Explication de ce qui se passe si l'utilisateur ne souscrit pas

## Architecture Technique

### Fichiers Impliqués

```
scripts/
  └── check-trial-expiration.ts      # Script principal exécuté par cron
  └── test-trial-expiration.ts       # Script de test manuel

src/
  ├── services/
  │   └── emailService.ts             # Fonction sendTrialExpiringEmail
  └── templates/
      └── emailTemplates.ts           # Template HTML de l'email

Dockerfile.cron                       # Configuration du cron Docker
docker-entrypoint-cron.sh            # Script de démarrage du cron
```

### Configuration Cron

Dans `Dockerfile.cron` :

```bash
# Trial expiration check - Every day at 9 AM
0 9 * * * cd /app && npx tsx scripts/check-trial-expiration.ts >> /var/log/cron-trial-check.log 2>&1
```

### Logs

Les logs du job sont disponibles dans :
- **Container** : `/var/log/cron-trial-check.log`
- **Accessible via** : `docker logs velvena-cron`

Format des logs :
```json
{
  "level": "info",
  "time": "2025-12-22T09:00:00.000Z",
  "organizationId": "uuid",
  "organizationName": "Example Org",
  "daysUntilExpiration": 7,
  "trialEndsAt": "2025-12-29T14:30:00.000Z",
  "usersToNotify": 2,
  "msg": "📧 Sending 7-day trial expiration reminder"
}
```

## Tests

### Test Manuel en Local

Pour tester le système sans attendre le cron :

```bash
# Définir votre email de test
export TEST_EMAIL="votre-email@example.com"

# Exécuter le script de test
npx tsx scripts/test-trial-expiration.ts
```

Ce script envoie **3 emails de test** (7j, 3j, 1j) à l'adresse configurée.

### Test en Production

Pour déclencher manuellement le job en production :

```bash
# Se connecter au container cron
docker exec -it velvena-cron sh

# Exécuter le script manuellement
cd /app
npx tsx scripts/check-trial-expiration.ts
```

### Vérifier les Logs

```bash
# Logs en temps réel
docker logs -f velvena-cron

# Dernières 100 lignes
docker logs --tail 100 velvena-cron

# Logs spécifiques au trial check
docker exec velvena-cron cat /var/log/cron-trial-check.log
```

## Métriques et Monitoring

### Informations Loggées

Le système log :
- ✅ Nombre total d'organisations en essai
- ✅ Organisations nécessitant un rappel (avec détails)
- ✅ Emails envoyés avec succès
- ❌ Échecs d'envoi
- 📊 Résumé final (total organisations, emails envoyés, erreurs)

### Exemple de Sortie Réussie

```
🔍 Starting trial expiration check...
📊 Found 5 organizations in trial period
📧 Sending 7-day trial expiration reminder
  organizationId: "abc-123"
  organizationName: "Example Boutique"
  daysUntilExpiration: 7
  usersToNotify: 2
✅ Trial expiration email sent
  userId: "user-1"
  email: "manager@example.com"
✅ Trial expiration email sent
  userId: "user-2"
  email: "admin@example.com"
✅ Trial expiration check completed
  totalOrganizations: 5
  emailsSent: 2
  errors: 0
```

## Gestion des Erreurs

### Échec d'Envoi Email

Si un email échoue :
1. L'erreur est loggée avec détails
2. Le compteur `errors` est incrémenté
3. Le script **continue** avec les autres utilisateurs/organisations

### Problèmes Base de Données

Si la connexion Prisma échoue :
1. L'erreur est loggée
2. Le script se termine avec code 1
3. Le cron réessayera le lendemain à 9h00

## Variables d'Environnement

```bash
# URL du frontend pour le lien "Choisir mon abonnement"
FRONTEND_URL=https://app.velvena.fr

# Configuration SMTP (Gandi)
SMTP_HOST=mail.gandi.net
SMTP_PORT=587
SMTP_USER=noreply@velvena.fr
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@velvena.fr
```

## Conformité RGPD

### Base Légale
- **Article 6.1(b) RGPD** : Exécution du contrat
- Les emails sont nécessaires pour informer l'utilisateur de la fin imminente de son essai

### Données Utilisées
- Email de l'utilisateur
- Prénom (ou "User" par défaut)
- Nom de l'organisation
- Date de fin d'essai

### Opt-out
Les utilisateurs peuvent :
- Supprimer leur compte (arrête tous les emails)
- Contacter le support pour demander l'exclusion

## Maintenance

### Modifier le Timing

Pour changer l'heure d'exécution, modifier `Dockerfile.cron` :

```dockerfile
# Exemple: Exécuter à 8h30 au lieu de 9h00
30 8 * * * cd /app && npx tsx scripts/check-trial-expiration.ts >> /var/log/cron-trial-check.log 2>&1
```

Puis rebuilder le container :
```bash
docker compose build cron
docker compose up -d cron
```

### Modifier les Jours de Rappel

Actuellement : 7, 3, 1 jour avant expiration

Pour ajouter/modifier (ex: ajouter 14 jours), éditer `scripts/check-trial-expiration.ts` :

```typescript
const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

// ... dans la boucle ...
if (Math.abs(trialEndsAt.getTime() - fourteenDaysFromNow.getTime()) < tolerance) {
  shouldSend = true;
  daysMark = 14;
}
```

### Personnaliser les Emails

Template HTML : `src/templates/emailTemplates.ts` > `getTrialExpiringEmailTemplate`

Sujets : `src/services/emailService.ts` > `sendTrialExpiringEmail`

## Dépannage

### Emails non reçus

1. **Vérifier les logs** :
   ```bash
   docker logs velvena-cron | grep "trial expiration"
   ```

2. **Vérifier que le cron tourne** :
   ```bash
   docker exec velvena-cron pgrep crond
   # Devrait retourner un PID
   ```

3. **Vérifier la configuration SMTP** :
   ```bash
   docker exec velvena-api env | grep SMTP
   ```

4. **Tester manuellement** :
   ```bash
   npx tsx scripts/test-trial-expiration.ts
   ```

### Cron ne s'exécute pas

1. **Vérifier le statut du container** :
   ```bash
   docker ps | grep cron
   # Statut devrait être "Up" et "healthy"
   ```

2. **Vérifier la crontab** :
   ```bash
   docker exec velvena-cron cat /etc/crontabs/root
   ```

3. **Vérifier les permissions** :
   ```bash
   docker exec velvena-cron ls -la /etc/crontabs/root
   # Devrait être 0644
   ```

### Trop d'emails envoyés

Si le même utilisateur reçoit plusieurs fois le même email :
- Vérifier que le cron ne s'exécute qu'une fois par jour
- Vérifier qu'il n'y a pas de duplications dans la table `users`

## Évolutions Futures

### Possibles Améliorations

1. **Tracking d'engagement** : Stocker si l'utilisateur a cliqué sur le lien d'upgrade
2. **A/B Testing** : Tester différents sujets/contenus
3. **Personnalisation avancée** : Adapter le message selon l'usage de la plateforme
4. **Rappel post-expiration** : Email "Revenez !" 7 jours après expiration
5. **Statistiques** : Dashboard Grafana avec taux d'ouverture, conversions

---

**Document créé le** : 22 décembre 2025
**Dernière mise à jour** : 22 décembre 2025
**Auteur** : Claude Code
**Version** : 1.0.0
