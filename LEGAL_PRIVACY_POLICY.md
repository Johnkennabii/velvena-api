# Politique de Confidentialité - Velvena

**Dernière mise à jour :** 22 décembre 2025

## 1. Identité du Responsable de Traitement

**Raison sociale :** [À COMPLÉTER - Nom de votre entreprise]
**Adresse :** [À COMPLÉTER]
**Email de contact :** contact@velvena.fr
**Responsable de la protection des données :** [À COMPLÉTER]

## 2. Données Personnelles Collectées

### 2.1 Données des Utilisateurs de la Plateforme

Lors de votre inscription et utilisation de Velvena, nous collectons :

- **Informations de compte :**
  - Adresse email
  - Mot de passe (hashé et sécurisé)
  - Rôle (MANAGER, ADMIN, etc.)
  - Statut de vérification email (email_verified)

- **Informations d'organisation :**
  - Nom de l'organisation
  - Adresse de l'organisation
  - Plan d'abonnement (Starter, Pro)
  - Date de fin de période d'essai
  - Statut d'abonnement (trial, active, canceled, etc.)

### 2.2 Données des Clients de Location

Pour la gestion de vos locations de robes, nous stockons :

- Nom et prénom
- Adresse email
- Numéro de téléphone
- Adresse postale
- Informations des prospects (demandes de location)
- Notes client

### 2.3 Données des Contrats

- Dates de location (début, fin, retour)
- Montants et tarifs
- Signatures électroniques
- Contenu des contrats générés
- Informations sur les robes louées

### 2.4 Données du Catalogue de Robes

- Photos des robes (stockées sur Hetzner Object Storage)
- Types, tailles, couleurs, conditions
- Prix de location
- Disponibilités

### 2.5 Données Techniques

- **Authentification :** Tokens JWT avec date d'expiration
- **Logs d'audit :** Actions effectuées sur la plateforme (conservés 7 ans)
- **Métriques système :** Statistiques d'utilisation (Prometheus/Grafana)
- **Connexions temps réel :** Socket.IO pour notifications
- **Adresse IP :** Pour la sécurité et les logs

### 2.6 Données de Paiement

- Informations de facturation (via Stripe)
- Historique des paiements
- Statut d'abonnement

**Important :** Les numéros de carte bancaire ne sont JAMAIS stockés sur nos serveurs. Ils sont traités directement par Stripe (certifié PCI-DSS).

## 3. Finalités du Traitement

Nous utilisons vos données pour :

| Finalité | Base légale (RGPD Art. 6) |
|----------|---------------------------|
| Gestion de votre compte utilisateur | Exécution du contrat |
| Gestion des locations et contrats | Exécution du contrat |
| Envoi d'emails de vérification | Exécution du contrat |
| Envoi d'emails de rappel d'expiration d'essai | Exécution du contrat |
| Facturation et paiements | Exécution du contrat + Obligation légale |
| Conservation des contrats (7 ans) | Obligation légale (comptabilité) |
| Génération de descriptions de robes par IA | Intérêt légitime (amélioration du service) |
| Notifications temps réel | Exécution du contrat |
| Logs d'audit et sécurité | Intérêt légitime (sécurité, lutte contre la fraude) |
| Métriques et statistiques | Intérêt légitime (amélioration du service) |

## 4. Durée de Conservation

| Type de données | Durée | Justification |
|-----------------|-------|---------------|
| Compte utilisateur actif | Durée de la relation commerciale | Nécessaire au service |
| Contrats de location | 7 ans | Obligation légale comptable |
| Logs d'audit | 7 ans maximum | Sécurité et traçabilité (nettoyage automatique) |
| Données clients inactifs | 3 ans après dernière location | Prescription commerciale |
| Photos de robes | Durée de présence au catalogue | Nécessaire au service |
| Exports temporaires de données | Suppression automatique après téléchargement | Technique |

**Jobs automatiques :**
- **2h00 :** Suppression des logs d'audit de plus de 7 ans
- **9h00 :** Vérification des périodes d'essai et envoi d'emails de rappel (7, 3 et 1 jour avant expiration)

## 5. Destinataires des Données

### 5.1 Accès Interne

- Utilisateurs de votre organisation (selon leur rôle : MANAGER, ADMIN)
- Équipe technique Velvena (uniquement pour maintenance et support)

### 5.2 Sous-traitants (Article 28 RGPD)

Nous faisons appel aux sous-traitants suivants, tous situés dans l'Union Européenne :

| Sous-traitant | Service | Localisation | Données traitées |
|---------------|---------|--------------|------------------|
| **Hetzner** | Hébergement + Stockage S3 | Allemagne (UE) | Toutes les données de la plateforme, photos |
| **Stripe** | Paiements | Irlande (UE) | Informations de facturation, montants |
| **Gandi** | Emails SMTP/IMAP | France (UE) | Emails envoyés/reçus |

**Traitement local :** La génération de descriptions par IA (Ollama) est effectuée localement sur nos serveurs. Aucune donnée n'est envoyée à un service externe d'intelligence artificielle.

### 5.3 Transferts hors UE

**Aucun transfert de données hors de l'Union Européenne n'est effectué.**

## 6. Sécurité des Données

Nous mettons en œuvre les mesures de sécurité suivantes :

### 6.1 Sécurité Technique

- **Chiffrement HTTPS/SSL :** Toutes les communications sont chiffrées (certificats Let's Encrypt)
- **Authentification sécurisée :** Tokens JWT avec expiration automatique
- **Mots de passe :** Hashage sécurisé (jamais stockés en clair)
- **Pare-feu applicatif :** Nginx reverse proxy
- **Isolation des données :** Architecture multi-tenant (une organisation ne peut pas accéder aux données d'une autre)
- **Headers de sécurité :** Helmet.js (protection XSS, clickjacking, etc.)
- **Rate limiting :** Protection contre les attaques par force brute

### 6.2 Sécurité Organisationnelle

- **Sauvegardes quotidiennes :** Base de données PostgreSQL sauvegardée chaque jour
- **Sauvegardes chiffrées :** Clé de chiffrement dédiée
- **Monitoring 24/7 :** Prometheus + Grafana pour détecter les anomalies
- **Logs d'audit :** Traçabilité de toutes les actions sensibles
- **Accès restreint :** Authentification obligatoire sur tous les endpoints

### 6.3 Disponibilité

- **Health checks :** Vérification automatique de la disponibilité des services
- **Conteneurs Docker :** Isolation et redémarrage automatique
- **Objectif de disponibilité :** 99% (hors maintenance programmée)

## 7. Vos Droits (Articles 15 à 22 RGPD)

Vous disposez des droits suivants :

### 7.1 Droit d'Accès (Art. 15)

Vous pouvez demander une copie de toutes vos données personnelles.

### 7.2 Droit de Rectification (Art. 16)

Vous pouvez modifier vos informations directement depuis votre compte ou nous contacter.

### 7.3 Droit à l'Effacement (Art. 17)

**Implémenté dans la plateforme :**
- Accédez à **Paramètres > Supprimer mon compte**
- Un code de validation est envoyé par email
- Toutes vos données sont supprimées définitivement après confirmation
- Un export automatique de vos données vous est proposé avant suppression

### 7.4 Droit à la Portabilité (Art. 20)

**Implémenté dans la plateforme :**
- Accédez à **Paramètres > Exporter mes données**
- Téléchargement d'une archive ZIP contenant :
  - Fichier JSON avec toutes vos données structurées
  - Photos et documents

### 7.5 Droit d'Opposition (Art. 21)

Vous pouvez vous opposer au traitement de vos données pour des raisons tenant à votre situation particulière (sauf obligations légales).

### 7.6 Droit à la Limitation du Traitement (Art. 18)

Vous pouvez demander la limitation du traitement dans certains cas (contestation, opposition, etc.).

### 7.7 Comment Exercer vos Droits ?

**Email :** contact@velvena.fr
**Délai de réponse :** 1 mois maximum (Art. 12 RGPD)
**Justificatif d'identité :** Peut être demandé pour des raisons de sécurité

## 8. Cookies et Traceurs

### 8.1 Cookies Essentiels (Pas de consentement requis)

| Cookie | Durée | Finalité |
|--------|-------|----------|
| Token JWT | Jusqu'à expiration | Authentification sécurisée |
| Session utilisateur | Session | Maintien de la connexion |

### 8.2 Cookies Fonctionnels

| Cookie | Durée | Finalité |
|--------|-------|----------|
| Préférences utilisateur | 1 an | Mémorisation des paramètres |

**Bannière de consentement :** Une bannière vous permet de gérer vos préférences lors de votre première visite.

### 8.3 Pas de Cookies Publicitaires

Velvena n'utilise aucun cookie de publicité, de tracking comportemental ou de réseaux sociaux.

## 9. Modifications de la Politique

Nous pouvons mettre à jour cette politique de confidentialité.

**Notification :** Vous serez informé par email au moins 30 jours avant toute modification substantielle.
**Date de mise à jour :** Indiquée en haut de ce document.

## 10. Réclamation

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de :

**CNIL (Commission Nationale de l'Informatique et des Libertés)**
Adresse : 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07
Téléphone : 01 53 73 22 22
Site web : https://www.cnil.fr/fr/plaintes

## 11. Contact

Pour toute question concernant cette politique ou vos données personnelles :

**Email :** contact@velvena.fr
**Réponse sous :** 48 heures ouvrées

---

**Document généré pour Velvena - Plateforme SaaS de Gestion de Location de Robes**
*Cette politique de confidentialité doit être validée par un avocat spécialisé en protection des données avant publication.*
