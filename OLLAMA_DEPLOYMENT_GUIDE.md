# 🤖 Guide de Déploiement Ollama - Velvena AI

Guide complet pour déployer et utiliser Ollama (LLM local) dans l'infrastructure Velvena.

---

## 📋 Table des matières

1. [Présentation](#présentation)
2. [Architecture](#architecture)
3. [Déploiement sur VPS](#déploiement-sur-vps)
4. [Configuration des modèles](#configuration-des-modèles)
5. [Utilisation depuis le Frontend](#utilisation-depuis-le-frontend)
6. [Monitoring](#monitoring)
7. [Optimisations](#optimisations)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Présentation

### Qu'est-ce qu'Ollama ?

Ollama est un serveur d'IA open-source qui permet d'exécuter des modèles LLM (Large Language Models) localement sur votre infrastructure.

### Pourquoi Ollama pour Velvena ?

- ✅ **Confidentialité** : Les données restent sur votre serveur
- ✅ **Coût** : Pas de frais d'API externes (OpenAI, Claude, etc.)
- ✅ **Contrôle** : Maîtrise totale du modèle utilisé
- ✅ **Performance** : Latence réduite (pas d'appel réseau externe)

### Modèles recommandés (7.6 GB RAM)

| Modèle | Taille | RAM requise | Usage |
|--------|--------|-------------|-------|
| `llama3.2:1b` | 1.3 GB | ~2 GB | Génération de texte rapide |
| `phi3:mini` | 2.3 GB | ~3 GB | Équilibre performance/qualité |
| `gemma2:2b` | 1.6 GB | ~2.5 GB | Génération de contrats |
| `qwen2.5:0.5b` | 397 MB | ~1 GB | Ultra-léger, réponses courtes |

---

## 🏗️ Architecture

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────┐
│     Nginx        │
│  Reverse Proxy   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   API Backend    │  ← Authentification JWT
│   (Express)      │  ← Logging & Métriques
└──────┬───────────┘
       │ HTTP (interne)
       ▼
┌──────────────────┐
│     Ollama       │
│   (Port 11434)   │
└──────────────────┘
```

**Sécurité :**
- ❌ Ollama n'est **PAS** exposé publiquement
- ✅ Accès uniquement via l'API backend (JWT requis)
- ✅ Logs et métriques pour tous les appels AI

---

## 🚀 Déploiement sur VPS

### Étape 1 : Préparer les fichiers

Les fichiers suivants ont été modifiés :

```
docker-compose.yml          ← Service Ollama ajouté
src/controllers/aiController/aiController.ts  ← Nouveau contrôleur
src/routes/aiRoutes.ts      ← Nouvelles routes
src/utils/metrics.ts        ← Métriques AI
src/server.ts              ← Routes enregistrées
```

### Étape 2 : Commit et Push

```bash
# Sur votre machine locale
cd /Users/johnkennabii/Documents/velvena

# Ajouter tous les fichiers
git add docker-compose.yml
git add src/controllers/aiController/
git add src/routes/aiRoutes.ts
git add src/utils/metrics.ts
git add src/server.ts
git add OLLAMA_DEPLOYMENT_GUIDE.md

# Committer
git commit -m "feat: add Ollama AI service integration

- Add Ollama service to docker-compose with memory limits
- Create AI proxy controller with JWT authentication
- Add AI routes for chat and completion
- Add AI metrics (requests counter, duration histogram)
- Ollama exposed only internally (127.0.0.1:11434)
- Resource limits: 3GB max, 2GB reserved

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push
```

### Étape 3 : Déployer sur le VPS

```bash
# Connexion au serveur
ssh root@VOTRE_IP_SERVEUR
cd /opt/velvena

# Pull les changements
git pull origin main

# Démarrer Ollama
docker compose up -d ollama

# Suivre les logs
docker compose logs -f ollama
```

### Étape 4 : Télécharger un modèle LLM

```bash
# Se connecter au container Ollama
docker compose exec ollama bash

# Télécharger phi3:mini (recommandé pour 8GB RAM)
ollama pull phi3:mini

# OU télécharger llama3.2:1b (plus léger)
ollama pull llama3.2:1b

# Lister les modèles installés
ollama list

# Quitter le container
exit
```

### Étape 5 : Rebuild et redémarrer l'API

```bash
# Rebuild l'API avec les nouvelles routes
docker compose build api

# Redémarrer l'API
docker compose up -d api

# Vérifier les logs
docker compose logs api --tail=50 | grep -i "ollama\|ai"
```

### Étape 6 : Vérifier l'installation

```bash
# 1. Vérifier qu'Ollama tourne
docker compose ps ollama

# 2. Tester directement Ollama (depuis le serveur)
curl http://localhost:11434/api/tags

# 3. Tester via l'API backend
curl -X POST https://api.velvena.fr/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "model": "phi3:mini",
    "prompt": "Écris une description courte pour une robe de soirée élégante.",
    "stream": false
  }'
```

---

## 📦 Configuration des modèles

### Télécharger plusieurs modèles

```bash
docker compose exec ollama bash

# Modèles légers (< 2GB)
ollama pull llama3.2:1b       # 1.3 GB - Rapide
ollama pull qwen2.5:0.5b      # 397 MB - Ultra-léger
ollama pull gemma2:2b         # 1.6 GB - Bon équilibre

# Modèles moyens (2-3GB)
ollama pull phi3:mini         # 2.3 GB - Recommandé
ollama pull mistral:7b-instruct-q2_K  # 2.7 GB - Quantisé

# Lister tous les modèles
ollama list

exit
```

### Supprimer un modèle

```bash
docker compose exec ollama ollama rm MODEL_NAME
```

### Espace disque occupé

```bash
# Voir l'espace utilisé par Ollama
docker compose exec ollama du -sh /root/.ollama

# Voir l'espace du volume Docker
docker system df -v | grep ollama_data
```

---

## 💻 Utilisation depuis le Frontend

### 1. Configuration Frontend

Créer un service API pour Ollama :

```typescript
// src/api/endpoints/ai.ts
import { apiClient } from "../apiClient";

export interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export const generateCompletion = async (data: GenerateRequest) => {
  const response = await apiClient.post("/ai/generate", data);
  return response.data;
};

export const chat = async (data: ChatRequest) => {
  const response = await apiClient.post("/ai/chat", data);
  return response.data;
};

export const listModels = async () => {
  const response = await apiClient.get("/ai/models");
  return response.data;
};
```

### 2. Exemple d'utilisation - Génération de description

```typescript
// src/components/DressForm.tsx
import { generateCompletion } from "../../api/endpoints/ai";
import { useState } from "react";

const DressForm = () => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const generateDescription = async (dressType: string, color: string) => {
    setLoading(true);
    try {
      const result = await generateCompletion({
        model: "phi3:mini",
        prompt: `Écris une description élégante et professionnelle pour une robe de ${dressType} de couleur ${color}. Maximum 2 phrases.`,
        stream: false,
      });

      setDescription(result.response);
    } catch (error) {
      console.error("Erreur génération AI:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => generateDescription("soirée", "rouge")} disabled={loading}>
        {loading ? "Génération..." : "Générer une description"}
      </button>
      {description && <p>{description}</p>}
    </div>
  );
};
```

### 3. Exemple d'utilisation - Chat

```typescript
// src/components/AIChat.tsx
import { chat, ChatMessage } from "../../api/endpoints/ai";
import { useState } from "react";

const AIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await chat({
        model: "phi3:mini",
        messages: [...messages, userMessage],
        stream: false,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.message.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur chat AI:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? "..." : "Envoyer"}
      </button>
    </div>
  );
};
```

---

## 📊 Monitoring

### Métriques Prometheus

Les métriques suivantes sont automatiquement collectées :

```
# Nombre de requêtes AI (par statut et modèle)
ai_requests_total{status="success|error", model="phi3:mini"}

# Durée des requêtes AI (par modèle)
ai_request_duration_seconds{model="phi3:mini"}
```

### Dashboard Grafana

Créer un dashboard avec ces requêtes PromQL :

```promql
# Nombre de requêtes AI par minute
rate(ai_requests_total[1m])

# Taux d'erreur AI
rate(ai_requests_total{status="error"}[5m]) / rate(ai_requests_total[5m])

# Latence p95 des requêtes AI
histogram_quantile(0.95, rate(ai_request_duration_seconds_bucket[5m]))

# Top 3 modèles les plus utilisés
topk(3, sum by(model)(rate(ai_requests_total[5m])))
```

### Logs

```bash
# Voir les logs Ollama
docker compose logs -f ollama

# Voir les logs API contenant "AI"
docker compose logs api | grep -i "ai completion\|ai chat"

# Voir les erreurs AI
docker compose logs api | grep -i "ai.*error"
```

---

## ⚡ Optimisations

### 1. Limiter la mémoire Ollama

Déjà configuré dans `docker-compose.yml` :

```yaml
deploy:
  resources:
    limits:
      memory: 3G    # Maximum 3GB
    reservations:
      memory: 2G    # Réservé 2GB
```

### 2. Limiter les modèles chargés

```yaml
environment:
  OLLAMA_MAX_LOADED_MODELS: "1"  # Un seul modèle en mémoire
```

### 3. Optimiser les prompts

```typescript
// ❌ Mauvais : prompt trop long
const prompt = "Écris un essai de 10 pages sur l'histoire de la mode française...";

// ✅ Bon : prompt court et précis
const prompt = "Écris une description courte (2 phrases) pour une robe de soirée rouge.";
```

### 4. Utiliser le cache

Les modèles gardent le contexte en cache. Réutilisez le même modèle pour de meilleures performances.

---

## 🔧 Troubleshooting

### Ollama ne démarre pas

```bash
# Vérifier les logs
docker compose logs ollama --tail=100

# Vérifier la mémoire disponible
free -h

# Redémarrer Ollama
docker compose restart ollama
```

### "Model not found"

```bash
# Se connecter au container
docker compose exec ollama bash

# Lister les modèles installés
ollama list

# Pull le modèle manquant
ollama pull phi3:mini

exit
```

### API retourne 500

```bash
# Vérifier que l'API peut atteindre Ollama
docker compose exec api curl http://ollama:11434/api/tags

# Si échec, vérifier le réseau Docker
docker network inspect velvena_velvena-network | grep ollama
```

### Ollama est lent

```bash
# 1. Vérifier l'utilisation mémoire
docker stats velvena-ollama

# 2. Utiliser un modèle plus léger
docker compose exec ollama ollama pull llama3.2:1b

# 3. Vérifier si d'autres services consomment de la RAM
docker stats
```

### Espace disque insuffisant

```bash
# Voir l'espace utilisé
df -h
docker system df

# Supprimer les anciens modèles
docker compose exec ollama ollama rm OLD_MODEL

# Nettoyer Docker
docker system prune -a --volumes
```

---

## 📝 Endpoints API disponibles

### POST /ai/generate

Génération de texte simple.

```bash
curl -X POST https://api.velvena.fr/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "model": "phi3:mini",
    "prompt": "Décris une robe élégante",
    "stream": false
  }'
```

### POST /ai/chat

Conversation multi-tours.

```bash
curl -X POST https://api.velvena.fr/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "model": "phi3:mini",
    "messages": [
      {"role": "user", "content": "Bonjour, aide-moi à décrire une robe"}
    ],
    "stream": false
  }'
```

### GET /ai/models

Liste des modèles disponibles.

```bash
curl https://api.velvena.fr/ai/models \
  -H "Authorization: Bearer YOUR_JWT"
```

### GET /ai/models/:model

Informations sur un modèle spécifique.

```bash
curl https://api.velvena.fr/ai/models/phi3:mini \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## 🎯 Cas d'usage Velvena

1. **Génération de descriptions de robes** - Créer automatiquement des descriptions marketing
2. **Assistance client** - Répondre aux questions fréquentes
3. **Génération de contrats** - Pré-remplir des clauses standards
4. **Traduction** - Traduire les descriptions en plusieurs langues
5. **Suggestions de prix** - Analyser le marché et suggérer des prix

---

**Documentation générée pour Velvena v1.0**
*Dernière mise à jour : Décembre 2025*
