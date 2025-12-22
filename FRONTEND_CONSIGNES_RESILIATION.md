# Consignes Frontend - Système de Résiliation d'Abonnement

## 📋 Vue d'Ensemble

Le backend gère maintenant 2 types de résiliation d'abonnement :
1. **Résiliation à la fin de la période** (recommandée, réversible)
2. **Résiliation immédiate** (irréversible)

## 🎯 Ce Que le Frontend Doit Implémenter

### 1. Afficher le Statut de Résiliation

**Appeler** `GET /billing/status` pour récupérer :

```json
{
  "is_cancelling": true,
  "cancellation_type": "end_of_period",
  "cancellation_date": "2025-01-22T14:30:00.000Z",
  "days_until_cancellation": 15
}
```

### 2. Bannière de Résiliation (OBLIGATOIRE)

**Si `is_cancelling === true`**, afficher une bannière **en haut de l'application** :

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Votre abonnement sera résilié le 22/01/2025      │
│     Plus que 15 jours avant la fin de votre abonnement│
│                                                        │
│     [Réactiver mon abonnement]                        │
└────────────────────────────────────────────────────────┘
```

**Couleur :** Fond orange (#FFF4E6), bordure orange (#F97316)

**Texte :**
- "Votre abonnement sera résilié le {date}" (format français : 22/01/2025)
- "Plus que {X} jours avant la fin de votre abonnement"
- Bouton : "Réactiver mon abonnement"

**Action du bouton :**
```typescript
POST /billing/reactivate-subscription
```

### 3. Page Paramètres > Abonnement

#### 3.1 Afficher le Statut

**Si abonnement actif ET PAS en cours de résiliation :**
```
Plan : Starter (19€/mois)
Statut : ✅ Actif
Prochaine facture : 22/01/2025

[Changer de plan]  [Annuler mon abonnement]
```

**Si abonnement actif MAIS résiliation programmée :**
```
Plan : Starter (19€/mois)
Statut : ⚠️ Résiliation programmée
Fin d'accès : 22/01/2025 (dans 15 jours)

Votre abonnement ne sera pas renouvelé. Vous gardez l'accès
jusqu'à la fin de la période payée.

[Réactiver mon abonnement]  [Gérer mon abonnement]
```

**Si abonnement annulé (cancelled) :**
```
Plan : Aucun
Statut : ❌ Résilié
Votre abonnement a été annulé le 15/12/2024

[Choisir un plan]
```

#### 3.2 Dialogue d'Annulation

**Quand l'utilisateur clique sur "Annuler mon abonnement" :**

```
┌─────────────────────────────────────────────────────────┐
│  Annuler votre abonnement                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Êtes-vous sûr de vouloir annuler votre abonnement ?   │
│                                                         │
│  Choisissez une option :                               │
│                                                         │
│  ○ Annuler à la fin de la période (recommandé)         │
│     • Vous gardez l'accès jusqu'au 22/01/2025          │
│     • Vous pourrez réactiver à tout moment             │
│     • Aucun remboursement                              │
│                                                         │
│  ○ Annuler immédiatement                               │
│     • Vous perdez l'accès tout de suite                │
│     • Action irréversible                              │
│     • Aucun remboursement                              │
│                                                         │
│  [Retour]         [Confirmer l'annulation]             │
└─────────────────────────────────────────────────────────┘
```

**Code d'annulation :**

```typescript
// Option 1 : Fin de période
await axios.post('/billing/cancel-subscription', {
  immediately: false
}, {
  headers: { Authorization: `Bearer ${token}` }
});

// Option 2 : Immédiat
await axios.post('/billing/cancel-subscription', {
  immediately: true
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 4. Bouton de Réactivation

**Condition d'affichage :**
```typescript
status.is_cancelling === true && status.cancellation_type === 'end_of_period'
```

**Action :**
```typescript
async function reactivateSubscription() {
  try {
    await axios.post('/billing/reactivate-subscription', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Afficher message de succès
    toast.success('Votre abonnement a été réactivé avec succès !');

    // Rafraîchir le statut
    refreshBillingStatus();
  } catch (error) {
    toast.error('Erreur lors de la réactivation de votre abonnement');
  }
}
```

## 📊 Données du Backend

### GET /billing/status

**Nouveaux champs ajoutés :**

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `is_cancelling` | boolean | Abonnement en cours de résiliation | `true` |
| `cancellation_type` | string\|null | Type de résiliation | `"end_of_period"` ou `"immediate"` ou `null` |
| `cancellation_date` | string\|null | Date de résiliation effective (ISO 8601) | `"2025-01-22T14:30:00.000Z"` |
| `days_until_cancellation` | number\|null | Jours restants avant résiliation | `15` |

### POST /billing/cancel-subscription

**Body :**
```json
{
  "immediately": false  // true pour annulation immédiate
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

### POST /billing/reactivate-subscription

**Body :** Aucun

**Réponse :**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully. It will continue at the end of the current period."
}
```

**Erreur si pas de résiliation programmée :**
```json
{
  "error": "Subscription is not scheduled for cancellation"
}
```

## 🎨 Recommandations UX

### Couleurs

- **Bannière résiliation** : Fond `#FFF4E6`, bordure `#F97316`, texte `#C2410C`
- **Statut actif** : Vert `#10B981`
- **Statut résiliation** : Orange `#F97316`
- **Statut annulé** : Rouge `#EF4444`

### Emojis

- ✅ Abonnement actif
- ⚠️ Résiliation programmée
- ❌ Abonnement annulé

### Messages

**Après résiliation programmée :**
```
✅ Votre abonnement sera résilié le 22/01/2025.
   Vous gardez l'accès jusqu'à cette date.
```

**Après résiliation immédiate :**
```
✅ Votre abonnement a été annulé immédiatement.
   Vous n'avez plus accès aux fonctionnalités payantes.
```

**Après réactivation :**
```
✅ Votre abonnement a été réactivé avec succès !
   Il sera renouvelé automatiquement le 22/01/2025.
```

## ⚠️ Règles Importantes

1. **TOUJOURS afficher la bannière** si `is_cancelling === true`
2. **Appeler GET /billing/status** au chargement de l'app et après chaque action de résiliation/réactivation
3. **Désactiver le bouton "Réactiver"** pendant le chargement (éviter double-clic)
4. **Afficher la date en français** : `new Date(date).toLocaleDateString('fr-FR')`
5. **Montrer clairement la différence** entre résiliation à la fin vs immédiate

## 📝 Checklist d'Implémentation

- [ ] Ajouter les champs de résiliation dans le type TypeScript `SubscriptionStatus`
- [ ] Créer le composant `<CancellationBanner />`
- [ ] Afficher la bannière dans le layout principal si `is_cancelling === true`
- [ ] Modifier la page Paramètres > Abonnement pour afficher le statut de résiliation
- [ ] Créer le dialogue d'annulation avec 2 options (radio buttons)
- [ ] Implémenter `POST /billing/cancel-subscription` avec le paramètre `immediately`
- [ ] Implémenter `POST /billing/reactivate-subscription`
- [ ] Tester le flow complet :
  - [ ] Annuler à la fin de période
  - [ ] Vérifier que la bannière s'affiche
  - [ ] Réactiver l'abonnement
  - [ ] Vérifier que la bannière disparaît
  - [ ] Annuler immédiatement
  - [ ] Vérifier que le statut passe à "cancelled"

## 🔗 Documentation Complète

Pour plus de détails techniques, voir :
- `FRONTEND_BILLING_INTEGRATION.md` - Guide complet d'intégration
- Section 6 : "Annuler un Abonnement"
- Section 6.2 : "Réactiver un Abonnement Annulé"

---

**Document créé le** : 22 décembre 2025
**Version** : 1.0.0
