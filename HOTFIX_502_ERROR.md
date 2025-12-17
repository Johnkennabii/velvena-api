# 🔥 HOTFIX - 502 Bad Gateway Error

## Problème identifié

L'API retournait une erreur 502 Bad Gateway lors du health check après déploiement.

### Cause racine

Le serveur Node.js écoutait sur `localhost` au lieu de `0.0.0.0`, ce qui le rendait inaccessible depuis l'extérieur du container Docker.

```typescript
// ❌ AVANT (ne fonctionne pas dans Docker)
server.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
```

### Solution appliquée

Modifier le serveur pour écouter sur `0.0.0.0` (toutes les interfaces réseau) :

```typescript
// ✅ APRÈS (fonctionne dans Docker)
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 API + Socket.IO running on http://${HOST}:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://${HOST}:${PORT}/health`);
});
```

## Fichier modifié

- `src/server.ts` (lignes 330-337)

## Pourquoi c'est important

Dans Docker :
- `localhost` = accessible uniquement DANS le container
- `0.0.0.0` = accessible depuis l'extérieur du container (via le réseau Docker)

Le workflow GitHub Actions teste le health check avec :
```bash
curl -f http://localhost:3000/health  # Depuis DANS le container
```

Et Nginx reverse proxy essaie d'accéder à :
```
http://api:3000  # Depuis l'EXTÉRIEUR du container
```

## Vérifications

Après ce fix, vérifiez que :

1. ✅ Le container démarre correctement :
   ```bash
   docker-compose logs api
   # Devrait afficher : "API + Socket.IO running on http://0.0.0.0:3000"
   ```

2. ✅ Le health check passe :
   ```bash
   docker-compose exec api curl -f http://localhost:3000/health
   # Devrait retourner 200 OK avec JSON
   ```

3. ✅ Nginx peut atteindre l'API :
   ```bash
   docker-compose exec nginx curl -f http://api:3000/health
   # Devrait retourner 200 OK
   ```

4. ✅ L'API est accessible publiquement :
   ```bash
   curl -f https://api.velvena.fr/health
   # Devrait retourner 200 OK
   ```

## Déploiement du fix

```bash
# Commiter le fix
git add src/server.ts
git commit -m "fix: listen on 0.0.0.0 for Docker compatibility

The server was listening on localhost which is not accessible
from outside the container. Changed to 0.0.0.0 to allow
Docker networking and health checks to work properly.

Fixes the 502 Bad Gateway error in production deployment."

# Push (déclenchera automatiquement le déploiement)
git push origin main
```

## Autres causes potentielles de 502 (si le fix ci-dessus ne suffit pas)

Si le problème persiste après ce fix, vérifiez :

1. **Variables d'environnement manquantes** :
   ```bash
   # Sur le serveur de production
   cat /opt/velvena/.env.production | grep -E "DATABASE_URL|JWT_SECRET"
   ```

2. **Base de données inaccessible** :
   ```bash
   docker-compose exec api npx prisma db push --accept-data-loss
   ```

3. **Migrations non appliquées** :
   ```bash
   docker-compose run --rm api npx prisma migrate deploy
   ```

4. **Logs du container API** :
   ```bash
   docker-compose logs api --tail=100
   ```

5. **Health check timeout** :
   ```yaml
   # Dans docker-compose.yml, augmenter le start_period
   healthcheck:
     start_period: 90s  # Au lieu de 60s
   ```

## Références

- GitHub Actions workflow : `.github/workflows/deploy.yml` ligne 158
- Docker Compose config : `docker-compose.yml` ligne 130
- Health check endpoint : `src/routes/health.ts` ligne 12
