# Dépannage Docker - Conteneur qui Redémarre en Boucle

## Diagnostic du Problème

Sur votre VPS, exécutez ces commandes pour identifier le problème :

### 1. Voir les logs du conteneur

```bash
# Voir les logs (même si le conteneur redémarre)
docker logs velvena-api --tail 100

# OU avec l'ID du conteneur
docker logs 8cf4025e11f6 --tail 100

# Suivre les logs en temps réel
docker logs velvena-api -f
```

### 2. Voir le statut des conteneurs

```bash
docker ps -a

# Voir les détails du conteneur
docker inspect velvena-api
```

### 3. Vérifier docker-compose

```bash
cd /opt/velvena
docker-compose ps
docker-compose logs api --tail 100
```

## Causes Communes et Solutions

### Cause 1 : Erreur dans les variables d'environnement

**Symptôme dans les logs** :
```
Error: DATABASE_URL is not set
Error: Invalid connection string
```

**Solution** :
```bash
# Vérifier le fichier .env.production
cat .env.production | grep DATABASE_URL

# Reconstruire le conteneur avec les bonnes variables
docker-compose down
docker-compose up -d
```

### Cause 2 : Base de données inaccessible

**Symptôme dans les logs** :
```
Error: Can't reach database server
ECONNREFUSED
Connection refused
```

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres
# OU si PostgreSQL est sur l'hôte
systemctl status postgresql

# Tester la connexion à la DB
docker-compose exec api sh
npx prisma db pull
exit
```

### Cause 3 : Port déjà utilisé

**Symptôme dans les logs** :
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution** :
```bash
# Voir quel processus utilise le port
sudo lsof -i :3000
# OU
sudo netstat -tulpn | grep :3000

# Arrêter le processus ou changer le port dans docker-compose.yml
```

### Cause 4 : Erreur de build/compilation TypeScript

**Symptôme dans les logs** :
```
SyntaxError: Unexpected token
Error: Cannot find module
TSError: ⨯ Unable to compile TypeScript
```

**Solution** :
```bash
# Rebuild l'image Docker
docker-compose down
docker-compose build --no-cache api
docker-compose up -d
```

### Cause 5 : Prisma Client non généré

**Symptôme dans les logs** :
```
Error: @prisma/client did not initialize yet
PrismaClient is unable to run in this browser environment
```

**Solution** :
```bash
# Générer le Prisma Client dans le conteneur
docker-compose down
docker-compose build --no-cache api
docker-compose up -d
```

## Commandes de Dépannage

### Sur votre VPS, exécutez dans cet ordre :

```bash
# 1. Voir les logs pour identifier l'erreur
docker logs velvena-api --tail 100 2>&1 | tee /tmp/docker-error.log

# 2. Arrêter tous les conteneurs
docker-compose down

# 3. Vérifier le fichier docker-compose.yml
cat docker-compose.yml

# 4. Vérifier que les variables d'environnement sont correctes
cat .env.production | grep -E "^[A-Z_]+="

# 5. Rebuild et redémarrer
docker-compose build --no-cache api
docker-compose up -d

# 6. Suivre les logs en temps réel
docker-compose logs -f api
```

## Une fois le conteneur stable

Quand le conteneur ne redémarre plus et fonctionne normalement :

```bash
# Vérifier qu'il tourne
docker ps | grep velvena-api

# Synchroniser les plans Stripe
docker-compose exec api npm run stripe:sync
```

## Si rien ne fonctionne : Mode Debug

```bash
# Lancer le conteneur en mode interactif
docker-compose down
docker-compose run --rm api sh

# Dans le conteneur
ls -la
cat .env.production
npm run build
npm start
# Voir où l'erreur se produit
exit
```
