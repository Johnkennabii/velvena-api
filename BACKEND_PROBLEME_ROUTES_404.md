# 🔴 Problème Backend - Routes retournent 404

## Symptôme

Les 3 nouveaux endpoints pour la gestion des doublons prospects/clients retournent **404 Not Found** :

```
GET /api/prospects/check-client?email=contact@velvena.fr
→ Cannot GET /api/prospects/check-client (404)

GET /api/prospects/:prospectId/merge-preview?client_id=xxx
→ 404

POST /api/prospects/:prospectId/merge-with-client
→ 404
```

## Cause probable

Les routes ne sont **pas enregistrées correctement** dans Express, ou le serveur n'a pas été redémarré après les modifications.

---

## ✅ Vérifications à faire

### 1️⃣ Vérifier que les routes sont bien déclarées

**Fichier : `src/routes/prospects.ts`**

Les routes doivent être ajoutées **AVANT** les routes avec paramètres `:prospectId`, sinon Express va matcher `/check-client` comme un `prospectId`.

```typescript
// ❌ MAUVAIS ORDRE (check-client sera traité comme un prospectId)
router.get('/:prospectId', prospectController.getProspectById);
router.get('/check-client', prospectController.checkExistingClient); // Ne sera jamais atteint

// ✅ BON ORDRE
router.get('/check-client', prospectController.checkExistingClient);
router.get('/:prospectId/merge-preview', prospectController.getMergePreview);
router.post('/:prospectId/merge-with-client', prospectController.mergeWithClient);
router.get('/:prospectId', prospectController.getProspectById); // Après les routes spécifiques
```

**Vérifier le fichier :**
```bash
cat src/routes/prospects.ts | grep -n "check-client\|merge-preview\|merge-with-client\|:prospectId"
```

### 2️⃣ Vérifier que les contrôleurs existent

**Fichier : `src/controllers/prospectController.ts`**

Les fonctions doivent être exportées :

```typescript
export const checkExistingClient = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // ... logique
  } catch (error) {
    // ... gestion erreur
  }
};

export const getMergePreview = async (req: Request, res: Response) => {
  // ...
};

export const mergeWithClient = async (req: Request, res: Response) => {
  // ...
};
```

**Vérifier que les fonctions sont exportées :**
```bash
grep "export.*checkExistingClient\|export.*getMergePreview\|export.*mergeWithClient" src/controllers/prospectController.ts
```

### 3️⃣ Vérifier que les routes sont importées dans l'app principal

**Fichier : `src/app.ts` ou `src/server.ts`**

```typescript
import prospectRoutes from './routes/prospects';

// Les routes doivent être montées sur /api/prospects
app.use('/api/prospects', prospectRoutes);
```

### 4️⃣ Vérifier que le serveur a été redémarré

Après toute modification des routes, **OBLIGATOIRE** :

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
# ou
npm start
```

---

## 🧪 Tests de vérification

### Test 1 : Lister toutes les routes

Si vous avez un middleware de debug routes :

```typescript
// Dans src/app.ts - TEMPORAIRE pour debug
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  }
});
```

Ou utilisez un package comme `express-list-routes` :

```bash
npm install --save-dev express-list-routes
```

```typescript
import listRoutes from 'express-list-routes';
listRoutes(app);
```

Vous devriez voir :
```
GET    /api/prospects/check-client
GET    /api/prospects/:prospectId/merge-preview
POST   /api/prospects/:prospectId/merge-with-client
```

### Test 2 : Curl manuel avec authentification

```bash
# Récupérer le token JWT depuis les cookies du navigateur
# DevTools → Application → Cookies → token

curl -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  "http://127.0.0.1:3000/api/prospects/check-client?email=test@example.com"

# Devrait retourner :
# {"success":true,"data":{"exists":false}}
# ou
# {"success":true,"data":{"exists":true,"client":{...}}}
```

### Test 3 : Logs au démarrage

Au démarrage du serveur, vous devriez voir :

```
[INFO] Routes chargées:
  ✓ GET    /api/prospects/check-client
  ✓ GET    /api/prospects/:prospectId/merge-preview
  ✓ POST   /api/prospects/:prospectId/merge-with-client
```

---

## 📝 Ordre correct des routes dans `src/routes/prospects.ts`

```typescript
import { Router } from 'express';
import * as prospectController from '../controllers/prospectController';
import { authenticate } from '../middleware/auth'; // ou votre middleware d'auth

const router = Router();

// ⚠️ IMPORTANT : Les routes spécifiques AVANT les routes avec paramètres

// === Routes de gestion des doublons (AVANT /:prospectId) ===
router.get('/check-client', authenticate, prospectController.checkExistingClient);

// === Routes standards ===
router.get('/', authenticate, prospectController.listProspects);
router.post('/', authenticate, prospectController.createProspect);

// === Routes avec :prospectId (APRÈS les routes spécifiques) ===
router.get('/:prospectId/merge-preview', authenticate, prospectController.getMergePreview);
router.post('/:prospectId/merge-with-client', authenticate, prospectController.mergeWithClient);
router.get('/:prospectId', authenticate, prospectController.getProspectById);
router.put('/:prospectId', authenticate, prospectController.updateProspect);
router.delete('/:prospectId', authenticate, prospectController.softDeleteProspect);
router.delete('/:prospectId/hard', authenticate, prospectController.hardDeleteProspect);
router.post('/:prospectId/convert', authenticate, prospectController.convertToCustomer);

// === Routes de notes ===
router.get('/:prospectId/notes', authenticate, prospectController.listProspectNotes);
router.post('/:prospectId/notes', authenticate, prospectController.createProspectNote);
// etc...

export default router;
```

---

## 🔍 Checklist de débogage

- [ ] Les routes sont dans `src/routes/prospects.ts` dans le **bon ordre**
- [ ] Les contrôleurs sont **exportés** dans `src/controllers/prospectController.ts`
- [ ] Les routes sont **montées** dans `src/app.ts` avec `app.use('/api/prospects', prospectRoutes)`
- [ ] Le serveur a été **redémarré** après les modifications
- [ ] Les logs de démarrage montrent les routes chargées
- [ ] Test curl retourne une réponse JSON (pas 404)
- [ ] Pas de middleware qui bloque avant la route (CORS, rate limiting, etc.)

---

## 💡 Solution rapide si ça ne fonctionne toujours pas

Si après toutes ces vérifications ça ne fonctionne toujours pas, essayez de créer une route de test ultra simple :

```typescript
// Dans src/routes/prospects.ts
router.get('/test-route-works', (req, res) => {
  res.json({ message: 'La route fonctionne !' });
});
```

Puis testez :
```bash
curl http://127.0.0.1:3000/api/prospects/test-route-works
```

- ✅ Si ça fonctionne → Le problème est dans les contrôleurs
- ❌ Si ça ne fonctionne pas → Le problème est dans le montage des routes

---

## 📞 Informations pour le frontend

Une fois que les routes fonctionnent, le frontend devrait automatiquement :

1. ✅ Ne plus avoir d'erreurs 404 dans la console
2. ✅ Afficher le modal de fusion quand un doublon est détecté
3. ✅ Permettre de fusionner/modifier/archiver les prospects

**Pas de modification frontend nécessaire** - tout est déjà en place ! 🚀
