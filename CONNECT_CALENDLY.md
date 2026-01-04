# 🔗 Comment connecter Calendly

## Étape 1 : Ouvrir l'URL d'autorisation

Cliquez sur ce lien ou copiez-le dans votre navigateur :

```
https://auth.calendly.com/oauth/authorize?client_id=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM&response_type=code&redirect_uri=http://localhost:5173/auth/calendly/callback
```

## Étape 2 : Autoriser l'application

1. **Connectez-vous** à votre compte Calendly
2. **Cliquez sur "Autoriser"** pour donner accès à Velvena
3. Vous serez **redirigé** vers `http://localhost:5173/auth/calendly/callback?code=XXXXX`

## Étape 3 : Récupérer le code

Dans l'URL de redirection, copiez le **code** (la partie après `?code=`)

Exemple :
```
http://localhost:5173/auth/calendly/callback?code=abc123def456
                                                    ↑
                                            Copiez cette partie
```

## Étape 4 : Compléter la connexion

### Si le frontend n'est pas démarré :

Utilisez cette commande (remplacez `VOTRE_CODE` et `VOTRE_MOT_DE_PASSE`) :

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"contact@velvena.fr","password":"VOTRE_MOT_DE_PASSE"}' | jq -r '.token')

# 2. Compléter l'OAuth avec le code
curl -X POST http://localhost:3000/calendly/oauth/callback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"VOTRE_CODE_ICI"}' | jq
```

### Si le frontend EST démarré :

Le frontend va automatiquement gérer le code et compléter la connexion !

## ✅ Vérification

Après avoir complété ces étapes, relancez le script de test :

```bash
./scripts/test-calendly-manual.sh contact@velvena.fr VOTRE_MOT_DE_PASSE
```

Vous devriez maintenant voir :
```
✅ Intégration Calendly connectée
   Utilisateur: Your Name
   Email: your@calendly.email
```

## 🎯 Résultat attendu

Après la connexion :
- ✅ Vos événements Calendly seront synchronisés automatiquement
- ✅ Un nouveau prospect sera créé pour chaque invité
- ✅ La synchronisation se fera toutes les 30 minutes
