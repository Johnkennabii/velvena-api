# 🚀 Setup Local - Guide Complet

Guide pas à pas pour installer et tester Velvena en local.

## 📋 Prérequis

### 1. Vérifier Node.js et npm

```bash
node --version  # Doit être >= 18.x
npm --version   # Doit être >= 9.x
```

Si pas installé : https://nodejs.org/

### 2. Installer PostgreSQL

**macOS (avec Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Télécharger depuis https://www.postgresql.org/download/windows/

### 3. Vérifier PostgreSQL

```bash
psql --version  # Doit afficher PostgreSQL 14.x ou supérieur
```

## 🗄️ Configuration de la Base de Données

### 1. Créer l'utilisateur et la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Dans psql:
CREATE USER velvena_user WITH PASSWORD 'velvena_password';
CREATE DATABASE velvena_db OWNER velvena_user;
GRANT ALL PRIVILEGES ON DATABASE velvena_db TO velvena_user;
\q
```

### 2. Tester la connexion

```bash
psql -U velvena_user -d velvena_db -h localhost
# Enter password: velvena_password
# Si ça marche, taper \q pour quitter
```

## ⚙️ Configuration de l'Application

### 1. Créer le fichier .env

```bash
cd /Users/johnkennabii/Documents/velvena
cp .env.example .env
```

### 2. Éditer le fichier .env

Ouvrir `.env` et configurer :

```env
# Base de données
DATABASE_URL="postgresql://velvena_user:velvena_password@localhost:5432/velvena_db?schema=public"

# JWT Secret (générer une clé aléatoire)
JWT_SECRET="votre-cle-secrete-super-longue-et-aleatoire-123456789"

# Email (Optionnel pour les tests)
SMTP_HOST=mail.gandi.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@example.com
SMTP_PASS=votre-mot-de-passe
SMTP_FROM="Velvena <votre-email@example.com>"

# IMAP (Optionnel pour les tests)
IMAP_HOST=mail.gandi.net
IMAP_PORT=993
IMAP_USER=votre-email@example.com
IMAP_PASSWORD=votre-mot-de-passe

# Hetzner Storage (Optionnel pour les tests)
HETZNER_ACCESS_KEY=your-access-key
HETZNER_SECRET_KEY=your-secret-key
HETZNER_BUCKET=your-bucket-name

# Port de l'application
PORT=3000
```

**💡 Astuce :** Pour générer un JWT_SECRET sécurisé :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📦 Installation des Dépendances

```bash
cd /Users/johnkennabii/Documents/velvena

# Installer les dépendances
npm install

# Cela peut prendre 2-3 minutes...
```

## 🗃️ Initialisation de la Base de Données

### 1. Générer le client Prisma

```bash
npm run prisma:generate
```

### 2. Créer les migrations

```bash
npx prisma migrate dev --name initial_setup
```

Vous verrez :
```
✔ Generated Prisma Client (...)
✔ Database synchronized with Prisma schema
✔ Created migration 20251206XXXXXX_initial_setup
```

### 3. Seed les données initiales

```bash
npm run prisma:seed
```

Vous devriez voir :
```
🌱 Starting seed...
📦 Creating default organization...
✅ Organization created: Default Organization (uuid)
👥 Creating global roles...
  ✅ Role: super_admin
  ✅ Role: admin
  ✅ Role: manager
  ✅ Role: user
👗 Creating global dress types...
  ✅ Type: Robe de soirée
  ...
🎉 Seed completed successfully!

🔑 Login credentials:
   Super Admin: admin@velvena.com / admin123
   Test User: user@velvena.com / user123
```

**⚠️ IMPORTANT :** Notez bien ces identifiants !

## 🔨 Build de l'Application

```bash
npm run build
```

Vous verrez TypeScript compiler tous les fichiers.

## ▶️ Démarrer l'Application

### Mode Développement (avec hot reload)

```bash
npm run dev
```

Vous devriez voir :
```
🚀 API + Socket.IO running on http://localhost:3000
```

### Mode Production

```bash
npm start
```

## ✅ Tests de Vérification

### 1. Test de l'API Root

```bash
curl http://localhost:3000/
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Allure Creation API is running 🚀"
}
```

### 2. Test du Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@velvena.com",
    "password": "admin123"
  }'
```

**Réponse attendue :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id": "uuid",
  "email": "admin@velvena.com",
  "role": "super_admin",
  "organization": {
    "id": "org-uuid",
    "name": "Default Organization",
    "slug": "default"
  }
}
```

**💡 Copiez le token !** Vous en aurez besoin pour les prochains tests.

### 3. Test de l'Organisation

```bash
# Remplacez YOUR_TOKEN par le token du login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:3000/organizations/me \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue :**
```json
{
  "id": "uuid",
  "name": "Default Organization",
  "slug": "default",
  "email": null,
  "subscription_plan": "free",
  "subscription_status": "trial",
  "is_active": true,
  "created_at": "2025-12-06T...",
  ...
}
```

### 4. Test des Stats de l'Organisation

```bash
curl http://localhost:3000/organizations/me/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue :**
```json
{
  "users": 2,
  "dresses": 0,
  "customers": 0,
  "prospects": 0,
  "active_contracts": 0
}
```

### 5. Test des Dress Types (données de référence globales)

```bash
curl http://localhost:3000/dress-types \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue :** Liste des types de robes créés par le seed.

### 6. Test de la Documentation Swagger

Ouvrir dans le navigateur :
```
http://localhost:3000/api-docs
```

Vous devriez voir l'interface Swagger UI avec toute la documentation de l'API.

## 🔧 Commandes Utiles

### Voir les logs de l'application

```bash
npm run dev  # Logs en temps réel avec pino-pretty
```

### Réinitialiser la base de données

```bash
# ⚠️ ATTENTION : Supprime toutes les données !
npx prisma migrate reset
npm run prisma:seed
```

### Ouvrir Prisma Studio (Interface graphique)

```bash
npx prisma studio
```

Ouvre http://localhost:5555 avec une interface pour voir/éditer la DB.

### Voir le schéma de la base de données

```bash
npx prisma studio
# OU
psql -U velvena_user -d velvena_db -c "\dt"
```

### Vérifier les migrations appliquées

```bash
npx prisma migrate status
```

## 🐛 Troubleshooting

### Problème : "Cannot find module"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème : "Connection refused" PostgreSQL

```bash
# Vérifier que PostgreSQL tourne
# macOS:
brew services list

# Linux:
sudo systemctl status postgresql

# Démarrer si nécessaire:
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql
```

### Problème : "Password authentication failed"

Vérifier le fichier `.env` :
- Le nom d'utilisateur est correct : `velvena_user`
- Le mot de passe est correct : `velvena_password`
- Le nom de la DB est correct : `velvena_db`

### Problème : "Port 3000 already in use"

```bash
# Trouver le processus
lsof -ti:3000

# Tuer le processus
kill -9 $(lsof -ti:3000)

# OU changer le port dans .env
PORT=3001
```

### Problème : Erreurs TypeScript

```bash
# Rebuild
npm run build

# Si ça persiste, nettoyer
rm -rf dist
npm run build
```

## 📊 Structure des Données Après Seed

### Organisations
- ✅ 1 organisation : "Default Organization"

### Utilisateurs
- ✅ admin@velvena.com (super_admin)
- ✅ user@velvena.com (user)

### Rôles Globaux
- ✅ super_admin
- ✅ admin
- ✅ manager
- ✅ user

### Données de Référence Globales
- ✅ 5 types de robes
- ✅ 15 tailles (XXS à 48)
- ✅ 13 couleurs
- ✅ 6 conditions
- ✅ 4 types de contrats

## 🎯 Prochaines Étapes

### 1. Tester les endpoints principaux

Utiliser Postman ou curl pour tester :
- ✅ Authentification (`/auth/login`)
- ✅ Organisation (`/organizations/me`)
- ✅ Dress types (`/dress-types`)
- ✅ Dress sizes (`/dress-sizes`)
- ✅ Dress colors (`/dress-colors`)

### 2. Créer des données de test

```bash
# Exemple: Créer une robe
curl -X POST http://localhost:3000/dresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robe Rouge",
    "reference": "RR-001",
    "price_ht": 100,
    "price_ttc": 120,
    "price_per_day_ht": 30,
    "price_per_day_ttc": 36,
    "type_id": "uuid-du-type",
    "size_id": "uuid-de-la-taille",
    "color_id": "uuid-de-la-couleur",
    "condition_id": "uuid-de-la-condition"
  }'
```

### 3. Migrer les contrôleurs existants

Consulter `MULTI_TENANT_MIGRATION_GUIDE.md` pour migrer les contrôleurs un par un.

### 4. Tester le système de pricing

```bash
# Calculer un prix
curl -X POST http://localhost:3000/pricing-rules/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dress_id": "uuid-de-la-robe",
    "start_date": "2025-12-10",
    "end_date": "2025-12-13"
  }'
```

### 5. Tester le système de quotas

```bash
# Créer plusieurs utilisateurs jusqu'à atteindre la limite
# Le plan Free limite à 1 utilisateur
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123",
    "roleName": "user"
  }'

# Devrait retourner une erreur 402 "Quota exceeded"
```

## 📚 Documentation

- **Multi-tenant :** `README_MULTI_TENANT.md`
- **Migration :** `MIGRATION_MULTI_TENANT.md`
- **Règles métier :** `BUSINESS_RULES_CONFIGURATION.md`
- **Abonnements :** `SUBSCRIPTION_SYSTEM.md`
- **API Swagger :** http://localhost:3000/api-docs

## ✅ Checklist de Vérification

- [ ] PostgreSQL installé et démarré
- [ ] Node.js >= 18.x installé
- [ ] Base de données créée
- [ ] Fichier `.env` configuré
- [ ] `npm install` exécuté avec succès
- [ ] `npm run prisma:generate` exécuté
- [ ] Migration appliquée avec succès
- [ ] Seed exécuté avec succès
- [ ] Application démarre sans erreur
- [ ] Test login réussi
- [ ] Token JWT reçu
- [ ] Swagger accessible

## 🎉 Succès !

Si tous les tests passent, votre installation est **complète et fonctionnelle** !

Vous pouvez maintenant :
1. ✅ Utiliser l'API
2. ✅ Tester les fonctionnalités
3. ✅ Développer de nouvelles features
4. ✅ Migrer les contrôleurs existants

**Bon développement ! 🚀**
