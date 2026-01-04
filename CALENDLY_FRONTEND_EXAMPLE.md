# 🎨 Exemple Frontend - Intégration Calendly

## Composant React pour l'intégration Calendly

### 1. Hook personnalisé pour l'API

```typescript
// hooks/useCalendly.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CalendlyIntegration {
  id: string;
  calendly_user_name: string;
  calendly_email: string;
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  last_synced_at: string | null;
  last_sync_error: string | null;
  next_sync_at: string | null;
  webhook_active: boolean;
  created_at: string;
}

export interface CalendlyEvent {
  id: string;
  event_name: string;
  event_start_time: string;
  event_end_time: string;
  event_status: string;
  invitee_name: string;
  invitee_email: string;
  location: string | null;
  prospect?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    status: string;
  };
}

export const useCalendly = () => {
  const [integration, setIntegration] = useState<CalendlyIntegration | null>(null);
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le statut de l'intégration
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/calendly/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.connected) {
        setIntegration(response.data.integration);
      } else {
        setIntegration(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les événements
  const fetchEvents = async (limit = 50) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/calendly/events?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Compléter l'OAuth avec le code
  const completeOAuth = async (code: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/calendly/oauth/callback`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        await fetchStatus();
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect Calendly');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Déclencher une synchronisation manuelle
  const triggerSync = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/calendly/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        await fetchEvents();
        await fetchStatus();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sync');
    } finally {
      setLoading(false);
    }
  };

  // Déconnecter l'intégration
  const disconnect = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/calendly/disconnect`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setIntegration(null);
      setEvents([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    integration,
    events,
    loading,
    error,
    fetchStatus,
    fetchEvents,
    completeOAuth,
    triggerSync,
    disconnect,
  };
};
```

---

### 2. Composant d'intégration Calendly

```typescript
// components/CalendlyIntegration.tsx
import React, { useEffect } from 'react';
import { useCalendly } from '../hooks/useCalendly';
import { useSearchParams } from 'react-router-dom';

const CALENDLY_CLIENT_ID = import.meta.env.VITE_CALENDLY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/calendly/callback`;

export const CalendlyIntegration: React.FC = () => {
  const {
    integration,
    events,
    loading,
    error,
    fetchEvents,
    completeOAuth,
    triggerSync,
    disconnect,
  } = useCalendly();

  const [searchParams] = useSearchParams();

  // Gérer le retour OAuth
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      completeOAuth(code).then((success) => {
        if (success) {
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [searchParams]);

  // Charger les événements si connecté
  useEffect(() => {
    if (integration) {
      fetchEvents();
    }
  }, [integration]);

  // Générer l'URL d'autorisation OAuth
  const handleConnect = () => {
    const authUrl = new URL('https://auth.calendly.com/oauth/authorize');
    authUrl.searchParams.append('client_id', CALENDLY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);

    window.location.href = authUrl.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* État de l'intégration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Intégration Calendly</h2>

        {!integration ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Connectez votre compte Calendly pour synchroniser automatiquement vos rendez-vous
              et créer des prospects.
            </p>
            <button
              onClick={handleConnect}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Connecter Calendly
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informations de connexion */}
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">{integration.calendly_user_name}</p>
                  <p className="text-sm text-green-700">{integration.calendly_email}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Connecté
                </span>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Dernière synchronisation</p>
                <p className="text-lg font-medium">
                  {integration.last_synced_at
                    ? new Date(integration.last_synced_at).toLocaleString('fr-FR')
                    : 'Jamais'}
                </p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Événements synchronisés</p>
                <p className="text-lg font-medium">{events.length}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={triggerSync}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                Synchroniser maintenant
              </button>
              <button
                onClick={disconnect}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
              >
                Déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des événements */}
      {integration && events.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Événements Calendly</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border rounded p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{event.event_name}</h4>
                    <p className="text-sm text-gray-600">
                      {event.invitee_name} ({event.invitee_email})
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.event_start_time).toLocaleString('fr-FR')}
                    </p>
                    {event.location && (
                      <p className="text-sm text-blue-600 mt-1">{event.location}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.event_status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {event.event_status === 'active' ? 'Actif' : 'Annulé'}
                    </span>
                    {event.prospect && (
                      <a
                        href={`/prospects/${event.prospect.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Voir le prospect →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### 3. Configuration du router

```typescript
// App.tsx ou router.tsx
import { CalendlyIntegration } from './components/CalendlyIntegration';

// Dans vos routes protégées:
<Route path="/settings/integrations/calendly" element={<CalendlyIntegration />} />
```

---

### 4. Variables d'environnement frontend

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_CALENDLY_CLIENT_ID=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM
```

```bash
# .env.production
VITE_API_URL=https://api.velvena.fr
VITE_CALENDLY_CLIENT_ID=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM
```

---

## 🎯 Fonctionnalités du composant

### ✅ Connexion OAuth
- Bouton "Connecter Calendly"
- Redirection vers Calendly pour autorisation
- Récupération et échange du code OAuth
- Affichage de l'état connecté

### ✅ Affichage de l'intégration
- Nom et email de l'utilisateur Calendly
- Dernière synchronisation
- Nombre d'événements synchronisés
- Badge de statut

### ✅ Actions
- Synchronisation manuelle
- Déconnexion de l'intégration
- Lien vers les prospects créés

### ✅ Liste des événements
- Nom de l'événement
- Informations sur l'invité
- Date et heure
- Lien de visio
- Statut (actif/annulé)
- Lien vers le prospect associé

---

## 🎨 Personnalisation

Vous pouvez personnaliser:
- Les couleurs et le style (Tailwind CSS)
- Le format des dates (locale fr-FR)
- Les informations affichées
- Les actions disponibles

---

## 📱 Version mobile

Le composant utilise Tailwind CSS et est responsive par défaut. Pour une meilleure expérience mobile:

```typescript
// Version mobile optimisée
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Statistiques responsive */}
</div>
```

---

## 🔒 Sécurité

- ✅ Les tokens sont stockés en backend (chiffrés)
- ✅ Le frontend ne manipule jamais les secrets
- ✅ Utilisation du JWT pour l'authentification
- ✅ Vérification de la signature des webhooks côté backend

---

## 🚀 Prochaines étapes

1. Intégrer le composant dans votre application
2. Tester le flux OAuth complet
3. Personnaliser le design selon votre charte graphique
4. Ajouter des notifications pour les nouvelles syncs
5. Créer des filtres pour les événements
