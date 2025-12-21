# 🎨 Guide d'Intégration Ollama - Frontend Velvena

Guide complet pour intégrer l'IA Ollama dans le frontend Velvena (React + TypeScript).

---

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Service API](#service-api)
3. [Hooks personnalisés](#hooks-personnalisés)
4. [Composants React](#composants-react)
5. [Cas d'usage Velvena](#cas-dusage-velvena)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Gestion des erreurs](#gestion-des-erreurs)

---

## 🚀 Configuration initiale

### Étape 1 : Créer le service API

Créez le fichier `src/api/endpoints/ai.ts` :

```typescript
// src/api/endpoints/ai.ts
import { apiClient } from "../apiClient";

// ==========================================
// Types
// ==========================================

export interface GenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
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

export interface ChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface AIModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ModelsResponse {
  models: AIModel[];
}

// ==========================================
// API Functions
// ==========================================

/**
 * Generate text completion
 */
export const generateCompletion = async (
  data: GenerateRequest
): Promise<GenerateResponse> => {
  const response = await apiClient.post<GenerateResponse>("/ai/generate", data);
  return response.data;
};

/**
 * Chat with AI (multi-turn conversation)
 */
export const chat = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>("/ai/chat", data);
  return response.data;
};

/**
 * List available AI models
 */
export const listModels = async (): Promise<AIModel[]> => {
  const response = await apiClient.get<ModelsResponse>("/ai/models");
  return response.data.models || [];
};

/**
 * Get info about a specific model
 */
export const getModelInfo = async (modelName: string): Promise<any> => {
  const response = await apiClient.get(`/ai/models/${modelName}`);
  return response.data;
};
```

---

## 🎣 Hooks personnalisés

### Hook 1 : useAIGenerate

Créez `src/hooks/useAIGenerate.ts` :

```typescript
// src/hooks/useAIGenerate.ts
import { useState } from "react";
import { generateCompletion } from "../api/endpoints/ai";
import { toast } from "react-hot-toast";

export const useAIGenerate = (model: string = "phi3:mini") => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Le prompt ne peut pas être vide");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateCompletion({
        model,
        prompt,
        stream: false,
      });

      setResult(response.response);
      return response.response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Erreur lors de la génération";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult("");
    setError(null);
  };

  return {
    generate,
    loading,
    result,
    error,
    reset,
  };
};
```

### Hook 2 : useAIChat

Créez `src/hooks/useAIChat.ts` :

```typescript
// src/hooks/useAIChat.ts
import { useState } from "react";
import { chat, ChatMessage } from "../api/endpoints/ai";
import { toast } from "react-hot-toast";

export const useAIChat = (model: string = "phi3:mini") => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    if (!content.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await chat({
        model,
        messages: [...messages, userMessage],
        stream: false,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage.content;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Erreur lors de l'envoi du message";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  const setSystemMessage = (content: string) => {
    setMessages([{ role: "system", content }]);
  };

  return {
    messages,
    sendMessage,
    loading,
    error,
    reset,
    setSystemMessage,
  };
};
```

### Hook 3 : useAIModels

Créez `src/hooks/useAIModels.ts` :

```typescript
// src/hooks/useAIModels.ts
import { useState, useEffect } from "react";
import { listModels, AIModel } from "../api/endpoints/ai";

export const useAIModels = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listModels();
      setModels(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Erreur lors du chargement des modèles";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
};
```

---

## 🧩 Composants React

### Composant 1 : AIDescriptionGenerator

Générateur de descriptions pour robes :

```typescript
// src/components/AI/AIDescriptionGenerator.tsx
import React, { useState } from "react";
import { useAIGenerate } from "../../hooks/useAIGenerate";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";

interface Props {
  dressType?: string;
  color?: string;
  size?: string;
  onGenerated?: (description: string) => void;
}

export const AIDescriptionGenerator: React.FC<Props> = ({
  dressType = "",
  color = "",
  size = "",
  onGenerated,
}) => {
  const { generate, loading, result, reset } = useAIGenerate("phi3:mini");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const prompt = `Écris une description élégante et professionnelle pour une robe ${dressType || "de soirée"} ${color ? `de couleur ${color}` : ""} ${size ? `taille ${size}` : ""}. La description doit être courte (2-3 phrases), attrayante pour un site de location de robes de luxe, et mettre en valeur l'élégance et la qualité du produit.`;

    const generatedText = await generate(prompt);

    if (generatedText && onGenerated) {
      onGenerated(generatedText);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Générateur de Description IA
        </h3>
        {result && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Type: <strong>{dressType || "Non spécifié"}</strong> |{" "}
          Couleur: <strong>{color || "Non spécifiée"}</strong> |{" "}
          Taille: <strong>{size || "Non spécifiée"}</strong>
        </p>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Générer une description
          </>
        )}
      </Button>

      {result && (
        <div className="space-y-2">
          <Textarea
            value={result}
            readOnly
            rows={4}
            className="bg-gray-50"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </>
              )}
            </Button>
            {onGenerated && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onGenerated(result)}
                className="flex-1"
              >
                Utiliser cette description
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Composant 2 : AIChat

Chat assistant pour aide client :

```typescript
// src/components/AI/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";
import { useAIChat } from "../../hooks/useAIChat";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MessageCircle, Send, Loader2, X } from "lucide-react";

interface Props {
  systemPrompt?: string;
  placeholder?: string;
}

export const AIChat: React.FC<Props> = ({
  systemPrompt = "Tu es un assistant virtuel professionnel pour Velvena, une plateforme de location de robes de luxe. Aide les clients avec leurs questions sur la location, les robes disponibles, et les contrats.",
  placeholder = "Posez votre question...",
}) => {
  const { messages, sendMessage, loading, reset, setSystemMessage } = useAIChat("phi3:mini");
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (systemPrompt) {
      setSystemMessage(systemPrompt);
    }
  }, [systemPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Assistant Velvena</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-purple-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.filter((m) => m.role !== "system").map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>Propulsé par Ollama AI</span>
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="text-purple-600 hover:underline"
                >
                  Nouvelle conversation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

### Composant 3 : AIModelSelector

Sélecteur de modèle IA :

```typescript
// src/components/AI/AIModelSelector.tsx
import React from "react";
import { useAIModels } from "../../hooks/useAIModels";
import { Select } from "../ui/Select";
import { Loader2, AlertCircle } from "lucide-react";

interface Props {
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

export const AIModelSelector: React.FC<Props> = ({
  value,
  onChange,
  className = "",
}) => {
  const { models, loading, error } = useAIModels();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement des modèles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Aucun modèle disponible
      </div>
    );
  }

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {models.map((model) => (
        <option key={model.name} value={model.name}>
          {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)} GB)
        </option>
      ))}
    </Select>
  );
};
```

---

## 💼 Cas d'usage Velvena

### 1. Génération de descriptions de robes

Dans votre formulaire de création/édition de robe :

```typescript
// src/pages/Catalogue/DressForm.tsx
import { AIDescriptionGenerator } from "../../components/AI/AIDescriptionGenerator";

const DressForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    color: "",
    size: "",
  });

  const handleAIDescriptionGenerated = (description: string) => {
    setFormData((prev) => ({
      ...prev,
      description,
    }));
  };

  return (
    <form>
      {/* ... autres champs ... */}

      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      {/* Générateur AI */}
      <AIDescriptionGenerator
        dressType={formData.type}
        color={formData.color}
        size={formData.size}
        onGenerated={handleAIDescriptionGenerated}
      />

      {/* ... boutons de soumission ... */}
    </form>
  );
};
```

### 2. Assistant client sur le site public

Dans votre layout principal :

```typescript
// src/layouts/PublicLayout.tsx
import { AIChat } from "../components/AI/AIChat";

const PublicLayout = ({ children }) => {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />

      {/* Chat AI flottant */}
      <AIChat
        systemPrompt="Tu es un assistant virtuel pour Velvena, une plateforme de location de robes de luxe pour mariages et événements. Aide les visiteurs à comprendre notre service de location, les aider à choisir une robe, et répondre aux questions sur les contrats et tarifs. Sois professionnel, chaleureux et concis."
        placeholder="Comment puis-je vous aider ?"
      />
    </div>
  );
};
```

### 3. Génération de clauses de contrat

```typescript
// src/components/Contracts/AIClauseGenerator.tsx
import { useAIGenerate } from "../../hooks/useAIGenerate";

export const AIClauseGenerator = ({ contractType, onGenerated }) => {
  const { generate, loading, result } = useAIGenerate("phi3:mini");

  const generateClause = async (clauseType: string) => {
    const prompts = {
      caution: "Génère une clause professionnelle sur la caution pour un contrat de location de robe de luxe. La clause doit préciser le montant, les conditions de remboursement, et les cas de retenue. Maximum 3 phrases.",
      retard: "Génère une clause professionnelle sur les pénalités de retard pour un contrat de location de robe de luxe. Maximum 3 phrases.",
      dommages: "Génère une clause professionnelle sur les dommages et réparations pour un contrat de location de robe de luxe. Maximum 3 phrases.",
    };

    const prompt = prompts[clauseType as keyof typeof prompts];
    if (prompt) {
      await generate(prompt);
    }
  };

  return (
    <div className="space-y-4">
      <h3>Générateur de Clauses AI</h3>

      <div className="flex gap-2">
        <button onClick={() => generateClause("caution")}>
          Clause Caution
        </button>
        <button onClick={() => generateClause("retard")}>
          Clause Retard
        </button>
        <button onClick={() => generateClause("dommages")}>
          Clause Dommages
        </button>
      </div>

      {loading && <p>Génération...</p>}

      {result && (
        <div>
          <textarea value={result} rows={4} readOnly />
          <button onClick={() => onGenerated(result)}>
            Utiliser cette clause
          </button>
        </div>
      )}
    </div>
  );
};
```

### 4. Traduction automatique

```typescript
// src/components/AI/AITranslator.tsx
import { useAIGenerate } from "../../hooks/useAIGenerate";

export const AITranslator = ({ text, onTranslated }) => {
  const { generate, loading } = useAIGenerate("phi3:mini");

  const translate = async (targetLang: string) => {
    const langNames = {
      en: "anglais",
      ar: "arabe",
      es: "espagnol",
      de: "allemand",
    };

    const prompt = `Traduis le texte suivant en ${langNames[targetLang as keyof typeof langNames]}. Retourne uniquement la traduction, sans commentaire :\n\n${text}`;

    const translation = await generate(prompt);
    if (translation) {
      onTranslated(targetLang, translation);
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => translate("en")} disabled={loading}>
        🇬🇧 Anglais
      </button>
      <button onClick={() => translate("ar")} disabled={loading}>
        🇸🇦 Arabe
      </button>
      <button onClick={() => translate("es")} disabled={loading}>
        🇪🇸 Espagnol
      </button>
    </div>
  );
};
```

---

## ✅ Bonnes pratiques

### 1. Gestion du chargement

Toujours afficher un indicateur de chargement :

```typescript
{loading ? (
  <Loader2 className="w-4 h-4 animate-spin" />
) : (
  <Sparkles className="w-4 h-4" />
)}
```

### 2. Limiter la longueur des prompts

```typescript
const MAX_PROMPT_LENGTH = 500;

const prompt = userInput.slice(0, MAX_PROMPT_LENGTH);
```

### 3. Cache des résultats

```typescript
const [cache, setCache] = useState<Map<string, string>>(new Map());

const generate = async (prompt: string) => {
  // Vérifier le cache
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const result = await generateCompletion({ model, prompt });

  // Mettre en cache
  setCache(prev => new Map(prev).set(prompt, result.response));

  return result.response;
};
```

### 4. Timeout pour les requêtes longues

```typescript
const generateWithTimeout = async (prompt: string, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await apiClient.post("/ai/generate",
      { model, prompt },
      { signal: controller.signal }
    );
    clearTimeout(id);
    return response.data;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("La requête a pris trop de temps");
    }
    throw error;
  }
};
```

### 5. Retry sur erreur

```typescript
const generateWithRetry = async (prompt: string, maxRetries = 2) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await generateCompletion({ model, prompt });
    } catch (error) {
      if (i === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## 🚨 Gestion des erreurs

### Afficher des messages d'erreur clairs

```typescript
const handleError = (error: any) => {
  const errorMessages: Record<string, string> = {
    401: "Vous devez être connecté pour utiliser cette fonctionnalité",
    403: "Vous n'avez pas accès à cette fonctionnalité",
    404: "Le modèle IA n'est pas disponible",
    500: "Le service IA est temporairement indisponible",
    503: "Le service IA est en maintenance",
  };

  const status = error.response?.status;
  const message = errorMessages[status] || "Une erreur s'est produite";

  toast.error(message);
};
```

### Component ErrorBoundary pour l'IA

```typescript
// src/components/AI/AIErrorBoundary.tsx
import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Erreur IA</h3>
          </div>
          <p className="text-sm text-red-700">
            Le service IA est temporairement indisponible. Veuillez réessayer plus tard.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utilisation
<AIErrorBoundary>
  <AIDescriptionGenerator />
</AIErrorBoundary>
```

---

## 📝 Checklist d'intégration

- [ ] Créer `src/api/endpoints/ai.ts`
- [ ] Créer les hooks : `useAIGenerate`, `useAIChat`, `useAIModels`
- [ ] Créer les composants : `AIDescriptionGenerator`, `AIChat`, `AIModelSelector`
- [ ] Implémenter la gestion d'erreurs
- [ ] Ajouter les indicateurs de chargement
- [ ] Tester avec différents modèles
- [ ] Configurer le cache (optionnel)
- [ ] Ajouter l'ErrorBoundary
- [ ] Tester les cas d'usage métier
- [ ] Documenter pour l'équipe

---

## 🎯 Points importants

1. **Toujours authentifier** : Tous les appels AI nécessitent un JWT token
2. **Modèle par défaut** : Utilisez `phi3:mini` pour un bon équilibre performance/qualité
3. **Prompts courts** : Limitez à 500 caractères maximum
4. **UX** : Toujours afficher un loader pendant la génération
5. **Erreurs** : Gérer gracieusement les erreurs réseau et timeouts
6. **Cache** : Mettre en cache les résultats fréquemment demandés
7. **Feedback** : Donner la possibilité de régénérer si le résultat ne convient pas

---

**Documentation générée pour Velvena v1.0**
*Dernière mise à jour : Décembre 2025*
