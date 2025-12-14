# Génération Automatique des Slugs d'Organisation

## 🎯 Comportement

Les slugs d'organisation sont **générés automatiquement** à partir du nom de l'organisation et **ne peuvent PAS être modifiés manuellement**.

---

## ✨ Fonctionnement

### Fonction `generateUniqueSlug(name: string)`

**Fichier** : `src/controllers/organizationController.ts`

```typescript
async function generateUniqueSlug(name: string): Promise<string> {
  // 1. Générer le slug de base depuis le nom
  const baseSlug = name
    .toLowerCase()                      // Minuscules
    .normalize("NFD")                   // Normaliser les caractères Unicode
    .replace(/[\u0300-\u036f]/g, "")   // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-")       // Remplacer espaces/caractères spéciaux par -
    .replace(/^-+|-+$/g, "")           // Enlever - au début/fin
    .substring(0, 50);                  // Limiter à 50 caractères

  // 2. Vérifier l'unicité
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
```

---

## 📋 Exemples de génération

| Nom de l'organisation | Slug généré |
|----------------------|-------------|
| `"Boutique Paris"` | `boutique-paris` |
| `"Allure Création"` | `allure-creation` |
| `"Ma Super Boutique !"` | `ma-super-boutique` |
| `"Café René & Fils"` | `cafe-rene-fils` |
| `"L'Atelier de Marie"` | `l-atelier-de-marie` |

### Gestion des doublons

Si le slug existe déjà, un suffixe numérique est ajouté :

| Nom | Slug généré |
|-----|-------------|
| `"Boutique Paris"` (1ère fois) | `boutique-paris` |
| `"Boutique Paris"` (2ème fois) | `boutique-paris-1` |
| `"Boutique Paris"` (3ème fois) | `boutique-paris-2` |

### Règles de transformation

- ✅ Minuscules uniquement : `"BOUTIQUE"` → `"boutique"`
- ✅ Suppression des accents : `"Café"` → `"cafe"`
- ✅ Espaces → tirets : `"Ma Boutique"` → `"ma-boutique"`
- ✅ Caractères spéciaux → tirets : `"L'Atelier"` → `"l-atelier"`
- ✅ Tirets multiples fusionnés : `"Ma  Boutique"` → `"ma-boutique"`
- ✅ Tirets début/fin supprimés : `" Boutique "` → `"boutique"`
- ✅ Limite 50 caractères

---

## 🔧 Implémentation Backend

### Endpoint 1 : `/organizations/initialize` (PUBLIC)

**Utilisé par** : Inscription des nouveaux utilisateurs

**Avant** :
```typescript
POST /organizations/initialize
{
  "organizationName": "Boutique Paris",
  "slug": "boutique-paris",  // ❌ Requis manuellement
  "userEmail": "manager@example.com",
  "password": "password123"
}
```

**Après** :
```typescript
POST /organizations/initialize
{
  "organizationName": "Boutique Paris",
  // ✅ slug généré automatiquement, pas de champ à fournir
  "userEmail": "manager@example.com",
  "password": "password123"
}

// Réponse :
{
  "organization": {
    "id": "...",
    "name": "Boutique Paris",
    "slug": "boutique-paris",  // ← Généré automatiquement
    "subscription_plan": "free"
  }
}
```

### Endpoint 2 : `/organizations` (SUPER ADMIN)

**Utilisé par** : Création manuelle d'organisations par les super admins

**Avant** :
```typescript
POST /organizations
{
  "name": "Boutique Lyon",
  "slug": "boutique-lyon",  // ❌ Requis manuellement
  "email": "contact@example.com"
}
```

**Après** :
```typescript
POST /organizations
{
  "name": "Boutique Lyon",
  // ✅ slug généré automatiquement
  "email": "contact@example.com"
}

// Réponse :
{
  "id": "...",
  "name": "Boutique Lyon",
  "slug": "boutique-lyon",  // ← Généré automatiquement
  "subscription_plan": "free"
}
```

---

## 💻 Implémentation Frontend

### Formulaire d'inscription

**Avant** (avec champ slug manuel) :
```tsx
<form>
  <input
    name="organizationName"
    placeholder="Nom de votre boutique"
    required
  />
  <input
    name="slug"
    placeholder="URL de votre boutique (ex: ma-boutique)"
    required  // ❌ Champ supplémentaire requis
  />
  <input
    name="userEmail"
    type="email"
    placeholder="Email"
    required
  />
  <input
    name="password"
    type="password"
    placeholder="Mot de passe"
    required
  />
  <button type="submit">S'inscrire</button>
</form>
```

**Après** (sans champ slug) :
```tsx
<form>
  <input
    name="organizationName"
    placeholder="Nom de votre boutique"
    required
  />
  {/* ✅ Plus de champ slug, généré automatiquement côté backend */}
  <input
    name="userEmail"
    type="email"
    placeholder="Email"
    required
  />
  <input
    name="password"
    type="password"
    placeholder="Mot de passe"
    required
  />
  <button type="submit">S'inscrire</button>
</form>
```

### Appel API

```typescript
const handleRegister = async (formData) => {
  const response = await fetch('https://api.velvena.fr/organizations/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationName: formData.organizationName,
      // ✅ Pas besoin de slug
      userEmail: formData.userEmail,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    })
  });

  const result = await response.json();

  // Le slug est retourné dans la réponse
  console.log(result.organization.slug); // Ex: "boutique-paris"
};
```

### Afficher le slug généré (optionnel)

Si vous voulez montrer le slug généré à l'utilisateur :

```tsx
const RegisterSuccess = ({ organization }) => {
  return (
    <div>
      <h2>Inscription réussie !</h2>
      <p>Nom de votre organisation : {organization.name}</p>
      <p>URL de votre espace :
        <strong>https://app.velvena.fr/{organization.slug}</strong>
      </p>
    </div>
  );
};
```

---

## 🔒 Sécurité et validation

### Backend

✅ **Unicité garantie** : La fonction `generateUniqueSlug` vérifie automatiquement l'unicité dans la base de données

✅ **Validation automatique** : Pas besoin de valider le slug côté frontend

✅ **Pas de collision** : Le suffixe numérique empêche toute collision

✅ **Caractères sûrs** : Seuls les caractères `a-z`, `0-9`, et `-` sont autorisés

### Impossible de modifier le slug

Le slug **n'est jamais** accepté dans le body des requêtes :

```typescript
// ❌ Ceci sera ignoré
POST /organizations/initialize
{
  "organizationName": "Ma Boutique",
  "slug": "custom-slug"  // ← IGNORÉ, slug généré quand même
}

// ✅ Slug toujours généré depuis organizationName
```

---

## 🧪 Tests

### Test 1 : Slug simple

```typescript
Input: "Boutique Paris"
Output: "boutique-paris"
```

### Test 2 : Accents et caractères spéciaux

```typescript
Input: "L'Atelier de Marie & René"
Output: "l-atelier-de-marie-rene"
```

### Test 3 : Doublons

```typescript
// Base de données contient déjà "boutique-paris"

Input: "Boutique Paris"
Output: "boutique-paris-1"

Input: "Boutique Paris" (encore)
Output: "boutique-paris-2"
```

### Test 4 : Nom très long

```typescript
Input: "Ma Super Boutique de Robes de Mariée et Accessoires à Paris 16ème"
Output: "ma-super-boutique-de-robes-de-mariee-et-acce"  // Tronqué à 50 chars
```

### Test 5 : Espaces multiples

```typescript
Input: "Ma   Boutique"
Output: "ma-boutique"  // Espaces multiples → un seul tiret
```

---

## 📊 Migration des données existantes

Si vous avez des organisations avec des slugs manuels, ils sont **préservés**. La génération automatique s'applique uniquement aux **nouvelles organisations**.

### Script de migration (optionnel)

Si vous voulez régénérer tous les slugs :

```typescript
// scripts/regenerate-slugs.ts
async function regenerateAllSlugs() {
  const organizations = await prisma.organization.findMany();

  for (const org of organizations) {
    const newSlug = await generateUniqueSlug(org.name);

    await prisma.organization.update({
      where: { id: org.id },
      data: { slug: newSlug }
    });

    console.log(`Updated ${org.name}: ${org.slug} → ${newSlug}`);
  }
}
```

⚠️ **Attention** : Cela changera les URLs des organisations existantes !

---

## ❓ FAQ

**Q : Peut-on personnaliser le slug après création ?**
**R** : Non, le slug est généré automatiquement et **ne peut pas être modifié**. C'est un identifiant permanent.

**Q : Que se passe-t-il si deux organisations ont exactement le même nom ?**
**R** : Un suffixe numérique est ajouté automatiquement : `boutique-paris`, `boutique-paris-1`, `boutique-paris-2`, etc.

**Q : Le slug peut-il être utilisé dans les URLs ?**
**R** : Oui ! C'est fait pour ça. Exemple : `https://app.velvena.fr/boutique-paris`

**Q : Peut-on avoir des slugs en majuscules ?**
**R** : Non, tous les slugs sont en minuscules pour garantir la cohérence des URLs.

**Q : Que se passe-t-il avec les emojis dans le nom ?**
**R** : Ils sont supprimés. Exemple : `"Ma Boutique 🎉"` → `"ma-boutique"`

**Q : Peut-on réserver un slug avant de créer l'organisation ?**
**R** : Non, le slug est généré uniquement lors de la création de l'organisation.

---

## ✅ Avantages

1. **UX améliorée** : L'utilisateur n'a plus besoin de penser à un slug
2. **Moins d'erreurs** : Pas de validation côté frontend nécessaire
3. **Unicité garantie** : Impossible d'avoir deux slugs identiques
4. **URLs cohérentes** : Format toujours propre et professionnel
5. **Simplicité** : Un champ en moins dans le formulaire d'inscription
