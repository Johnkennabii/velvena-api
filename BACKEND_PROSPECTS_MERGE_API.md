# API Backend - Gestion des Doublons Prospects/Clients

## Contexte
Le frontend a besoin de 3 nouveaux endpoints pour gérer intelligemment les cas où un prospect a le même email qu'un client existant.

---

## 1. Vérifier si un email existe comme client

**Endpoint :** `GET /api/prospects/check-client`

**Query Parameters :**
- `email` (string, required) : L'email à vérifier

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "client": {
      "id": "cm123abc",
      "firstname": "Marie",
      "lastname": "Dupont",
      "email": "marie.dupont@example.com",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Réponse si le client n'existe pas (200) :**
```json
{
  "success": true,
  "data": {
    "exists": false
  }
}
```

**Logique backend :**
1. Rechercher dans la table `customers` un client avec cet email
2. Si trouvé, retourner `exists: true` avec les infos du client
3. Si non trouvé, retourner `exists: false`

---

## 2. Aperçu des données à fusionner

**Endpoint :** `GET /api/prospects/:prospectId/merge-preview`

**Query Parameters :**
- `client_id` (string, required) : L'ID du client existant

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "notes_count": 3,
    "reservations_count": 2
  }
}
```

**Logique backend :**
1. Compter le nombre de notes du prospect (table `prospect_notes` où `prospect_id = :prospectId` et `deleted_at IS NULL`)
2. Compter le nombre de réservations du prospect (table `prospect_reservations` où `prospect_id = :prospectId`)
3. Retourner les compteurs

---

## 3. Fusionner prospect avec client existant

**Endpoint :** `POST /api/prospects/:prospectId/merge-with-client`

**Body :**
```json
{
  "client_id": "cm123abc"
}
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Prospect fusionné avec succès"
}
```

**Logique backend :**

### Étape 1 : Vérifications
- Vérifier que le prospect existe et n'est pas déjà converti
- Vérifier que le client existe
- Vérifier que l'email du prospect correspond à celui du client

### Étape 2 : Transférer les notes
```sql
-- Transférer les notes du prospect vers le client
UPDATE prospect_notes
SET
  -- Selon votre schéma, adapter pour lier au client
  -- Vous pourriez créer une table customer_notes ou adapter le système
  transferred_to_customer_id = :clientId,
  updated_at = NOW()
WHERE
  prospect_id = :prospectId
  AND deleted_at IS NULL
```

**Note importante :** Si vous n'avez pas de système de notes pour les clients, vous pouvez :
- Option A : Créer une table `customer_notes` similaire à `prospect_notes`
- Option B : Ajouter les notes comme un JSON dans un champ du client
- Option C : Ignorer le transfert des notes (juste les compter dans le preview)

### Étape 3 : Transférer les réservations
```sql
-- Transférer les réservations vers le client
UPDATE prospect_reservations
SET
  -- Convertir en réservations client selon votre schéma
  customer_id = :clientId,
  prospect_id = NULL,
  updated_at = NOW()
WHERE prospect_id = :prospectId
```

**Note :** Adapter selon votre schéma. Si les réservations de prospects et clients sont dans des tables différentes, créer de nouvelles entrées dans la table clients.

### Étape 4 : Marquer le prospect comme fusionné
```sql
UPDATE prospects
SET
  status = 'converted',
  converted_at = NOW(),
  deleted_at = NOW(), -- Soft delete
  updated_at = NOW()
WHERE id = :prospectId
```

### Étape 5 : Logs/Audit (optionnel mais recommandé)
```sql
INSERT INTO audit_logs (action, entity_type, entity_id, details, created_at)
VALUES (
  'prospect_merged_with_client',
  'prospect',
  :prospectId,
  JSON_OBJECT(
    'client_id', :clientId,
    'notes_transferred', :notesCount,
    'reservations_transferred', :reservationsCount
  ),
  NOW()
)
```

---

## Erreurs à gérer

### 404 - Prospect ou client non trouvé
```json
{
  "success": false,
  "error": "Prospect ou client introuvable"
}
```

### 400 - Email ne correspond pas
```json
{
  "success": false,
  "error": "L'email du prospect ne correspond pas à celui du client"
}
```

### 409 - Prospect déjà converti
```json
{
  "success": false,
  "error": "Ce prospect a déjà été converti en client"
}
```

---

## Exemples d'utilisation Frontend

```typescript
// 1. Vérifier si l'email existe
const checkResult = await ProspectsAPI.checkExistingClient("marie@example.com");
if (checkResult.exists) {
  console.log("Client existant:", checkResult.client);
}

// 2. Aperçu de la fusion
const preview = await ProspectsAPI.getMergePreview("prospect_id", "client_id");
console.log(`${preview.notes_count} notes et ${preview.reservations_count} réservations`);

// 3. Fusionner
await ProspectsAPI.mergeWithClient("prospect_id", "client_id");
```

---

## Schéma de tables suggéré

Si vous n'avez pas encore de système de notes pour les clients, voici une suggestion :

```sql
CREATE TABLE customer_notes (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_from_calendly BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  created_by VARCHAR(255),

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer_id (customer_id),
  INDEX idx_deleted_at (deleted_at)
);
```

Ainsi, lors de la fusion, vous pouvez copier les notes :

```sql
INSERT INTO customer_notes (id, customer_id, content, is_from_calendly, created_by, created_at)
SELECT
  CONCAT('note_', UUID()) as id,
  :clientId as customer_id,
  content,
  is_from_calendly,
  created_by,
  NOW()
FROM prospect_notes
WHERE prospect_id = :prospectId AND deleted_at IS NULL
```

---

## Ordre d'implémentation recommandé

1. **Commencer par** : `GET /prospects/check-client` (le plus simple)
2. **Ensuite** : `GET /prospects/:id/merge-preview` (lecture simple)
3. **Enfin** : `POST /prospects/:id/merge-with-client` (logique complexe avec transaction)

## Transaction SQL pour la fusion

Il est **crucial** d'utiliser une transaction pour garantir l'intégrité des données :

```javascript
// Exemple avec Prisma
await prisma.$transaction(async (tx) => {
  // 1. Vérifications
  const prospect = await tx.prospect.findUnique({ where: { id: prospectId } });
  const client = await tx.customer.findUnique({ where: { id: clientId } });

  if (!prospect || !client) {
    throw new Error("Prospect ou client introuvable");
  }

  if (prospect.email !== client.email) {
    throw new Error("Les emails ne correspondent pas");
  }

  // 2. Transférer les notes
  const notesToTransfer = await tx.prospectNote.findMany({
    where: { prospectId, deletedAt: null }
  });

  for (const note of notesToTransfer) {
    await tx.customerNote.create({
      data: {
        customerId: clientId,
        content: note.content,
        isFromCalendly: note.isFromCalendly,
        createdBy: note.createdBy,
      }
    });
  }

  // 3. Transférer les réservations (adapter selon votre schéma)
  // ...

  // 4. Marquer le prospect comme fusionné
  await tx.prospect.update({
    where: { id: prospectId },
    data: {
      status: 'converted',
      convertedAt: new Date(),
      deletedAt: new Date(),
    }
  });
});
```

---

## Questions ?

Si vous avez des questions sur l'implémentation ou si vous souhaitez adapter ces spécifications à votre architecture backend spécifique, n'hésitez pas !
