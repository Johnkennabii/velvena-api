# 📱 Frontend - Intégration Socket.IO pour les Prospects

## 🎯 Objectif

Mettre à jour la liste des prospects **en temps réel** lorsque :
- Un nouveau prospect est créé (via Calendly ou manuellement)
- Un prospect est mis à jour
- Un prospect est supprimé

## 📦 Installation

Si pas déjà installé :
```bash
npm install socket.io-client
```

## 🔌 Connexion Socket.IO

### Configuration de base

```typescript
// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string) {
  if (socket?.connected) {
    return socket;
  }

  socket = io('http://127.0.0.1:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('🟢 Socket.IO connecté:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket.IO déconnecté');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Erreur Socket.IO:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
```

### Initialisation au login

```typescript
// Dans votre service d'authentification après login réussi
import { connectSocket } from './lib/socket';

async function login(email: string, password: string) {
  const response = await fetch('http://127.0.0.1:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const { token, user } = await response.json();

  // Stocker le token
  localStorage.setItem('token', token);

  // ✅ Connecter Socket.IO
  connectSocket(token);

  return { token, user };
}
```

### Déconnexion au logout

```typescript
import { disconnectSocket } from './lib/socket';

function logout() {
  localStorage.removeItem('token');
  disconnectSocket();
  // Rediriger vers /signin
}
```

## 📡 Écouter les événements Prospects

### Dans votre page/composant de liste de prospects

```typescript
// ProspectsPage.tsx ou ProspectsList.tsx
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface Prospect {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // ✅ Nouveau prospect créé
    socket.on('prospect:created', (newProspect: Prospect) => {
      console.log('🟢 Nouveau prospect:', newProspect);
      setProspects((prev) => [newProspect, ...prev]);

      // Optionnel : Afficher une notification toast
      showToast({
        title: 'Nouveau prospect',
        message: `${newProspect.firstname} ${newProspect.lastname} a été ajouté`,
        type: 'success'
      });
    });

    // ✅ Prospect mis à jour
    socket.on('prospect:updated', (updatedProspect: Prospect) => {
      console.log('🔄 Prospect mis à jour:', updatedProspect);
      setProspects((prev) =>
        prev.map((p) => (p.id === updatedProspect.id ? updatedProspect : p))
      );

      // Si prospect Calendly, afficher notification de nouveau RDV
      if (updatedProspect.source === 'calendly') {
        showToast({
          title: 'Nouveau rendez-vous',
          message: `${updatedProspect.firstname} ${updatedProspect.lastname} a pris un nouveau rendez-vous`,
          type: 'info'
        });
      }
    });

    // ✅ Prospect supprimé
    socket.on('prospect:deleted', ({ id }: { id: string }) => {
      console.log('🔴 Prospect supprimé:', id);
      setProspects((prev) => prev.filter((p) => p.id !== id));
    });

    // Cleanup à la déconnexion du composant
    return () => {
      socket.off('prospect:created');
      socket.off('prospect:updated');
      socket.off('prospect:deleted');
    };
  }, []);

  // Reste de votre composant...
  return (
    <div>
      {prospects.map(prospect => (
        <ProspectCard key={prospect.id} prospect={prospect} />
      ))}
    </div>
  );
}
```

## 🔔 Écouter les notifications Calendly

```typescript
// NotificationsManager.tsx
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  meta: any;
  created_at: string;
}

export function NotificationsManager() {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('notification', (notification: Notification) => {
      console.log('📢 Nouvelle notification:', notification);

      // Afficher une notification toast
      if (notification.type === 'calendly_prospect_created') {
        showToast({
          title: notification.title,
          message: notification.message,
          type: 'info',
          duration: 5000,
          action: {
            label: 'Voir le prospect',
            onClick: () => {
              // Naviguer vers le prospect
              window.location.href = `/prospects/${notification.meta.prospect_id}`;
            }
          }
        });
      }

      // Mettre à jour le compteur de notifications non lues
      updateUnseenCount();
    });

    return () => {
      socket.off('notification');
    };
  }, []);

  return null; // Composant invisible
}
```

## 🎨 Exemple avec React Query

Si vous utilisez React Query pour gérer vos données :

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export function useProspectsSocketSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('prospect:created', (newProspect) => {
      // Invalider et refetch la liste
      queryClient.invalidateQueries({ queryKey: ['prospects'] });

      // OU optimiser en ajoutant directement à la cache
      queryClient.setQueryData(['prospects'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: [newProspect, ...old.data],
          total: old.total + 1
        };
      });
    });

    socket.on('prospect:updated', (updatedProspect) => {
      queryClient.setQueryData(['prospects'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p: any) =>
            p.id === updatedProspect.id ? updatedProspect : p
          )
        };
      });

      // Invalider aussi le détail du prospect si ouvert
      queryClient.invalidateQueries({
        queryKey: ['prospect', updatedProspect.id]
      });
    });

    socket.on('prospect:deleted', ({ id }) => {
      queryClient.setQueryData(['prospects'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((p: any) => p.id !== id),
          total: old.total - 1
        };
      });
    });

    return () => {
      socket.off('prospect:created');
      socket.off('prospect:updated');
      socket.off('prospect:deleted');
    };
  }, [queryClient]);
}

// Utilisation dans votre page
export function ProspectsPage() {
  useProspectsSocketSync(); // Active la synchronisation Socket.IO

  const { data, isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: fetchProspects
  });

  // Reste du composant...
}
```

## 🔐 Gestion de la reconnexion

```typescript
// Dans src/lib/socket.ts - Ajouter la gestion de reconnexion

socket.on('connect', () => {
  console.log('🟢 Socket.IO connecté:', socket?.id);

  // Refetch les données après reconnexion pour être à jour
  if (window.location.pathname.includes('/prospects')) {
    window.dispatchEvent(new CustomEvent('socket-reconnected'));
  }
});

socket.on('disconnect', (reason) => {
  console.log('🔴 Socket.IO déconnecté:', reason);

  if (reason === 'io server disconnect') {
    // Le serveur a fermé la connexion, reconnecter manuellement
    socket.connect();
  }
  // Pour les autres raisons, Socket.IO reconnecte automatiquement
});
```

Puis dans votre composant :

```typescript
useEffect(() => {
  const handleReconnect = () => {
    // Refetch les prospects après reconnexion
    refetchProspects();
  };

  window.addEventListener('socket-reconnected', handleReconnect);

  return () => {
    window.removeEventListener('socket-reconnected', handleReconnect);
  };
}, [refetchProspects]);
```

## 🧪 Test de l'intégration

### 1. Vérifier la connexion

Ouvrez la console du navigateur et vérifiez :
```
🟢 Socket.IO connecté: abc123xyz
```

### 2. Tester en direct

1. **Ouvrez deux navigateurs/onglets** avec deux utilisateurs de la même organisation
2. **Créez un prospect** dans l'un → L'autre devrait voir le nouveau prospect apparaître
3. **Modifiez un prospect** → Les changements apparaissent dans l'autre onglet
4. **Supprimez un prospect** → Il disparaît dans l'autre onglet

### 3. Tester Calendly

1. Connectez Calendly via le frontend
2. Réservez un rendez-vous sur votre lien Calendly
3. **Vérifiez** :
   - Nouveau prospect apparaît en temps réel (si nouveau)
   - Notification apparaît "Nouveau prospect Calendly"
   - Notes du prospect contiennent le rendez-vous

## ⚠️ Points d'attention

### 1. Performance

Si vous avez beaucoup d'utilisateurs connectés, limiter les données envoyées :

```typescript
// Backend déjà optimisé - envoie uniquement les champs nécessaires
socket.on('prospect:created', (prospect) => {
  // Prospect contient uniquement : id, firstname, lastname, email,
  // phone, status, source, notes, created_at
  // Pas de relations lourdes comme dress_reservations
});
```

### 2. Filtrage côté client

Si votre liste est filtrée, vérifiez que les nouveaux prospects correspondent aux filtres :

```typescript
socket.on('prospect:created', (newProspect) => {
  // Vérifier si le prospect correspond au filtre actuel
  if (currentFilter.status && newProspect.status !== currentFilter.status) {
    return; // Ne pas ajouter à la liste affichée
  }

  setProspects((prev) => [newProspect, ...prev]);
});
```

### 3. Éviter les doublons

Si vous utilisez un système de polling en plus de Socket.IO :

```typescript
const [prospects, setProspects] = useState<Prospect[]>([]);
const prospectsRef = useRef<Map<string, Prospect>>(new Map());

socket.on('prospect:created', (newProspect) => {
  // Vérifier que le prospect n'existe pas déjà
  if (prospectsRef.current.has(newProspect.id)) {
    return;
  }

  prospectsRef.current.set(newProspect.id, newProspect);
  setProspects((prev) => [newProspect, ...prev]);
});
```

## 📋 Checklist Frontend

- [ ] Socket.IO client installé
- [ ] Connexion Socket.IO configurée dans `src/lib/socket.ts`
- [ ] Connexion Socket.IO initialisée au login
- [ ] Déconnexion Socket.IO au logout
- [ ] Écoute de `prospect:created` dans la liste des prospects
- [ ] Écoute de `prospect:updated` dans la liste des prospects
- [ ] Écoute de `prospect:deleted` dans la liste des prospects
- [ ] Écoute de `notification` pour les notifications Calendly
- [ ] Affichage de toast/notifications pour les nouveaux prospects
- [ ] Gestion de la reconnexion Socket.IO
- [ ] Tests effectués avec plusieurs utilisateurs

## 🔗 Variables d'environnement

```bash
# .env.development ou .env.local
VITE_API_URL=http://127.0.0.1:3000
VITE_SOCKET_URL=http://127.0.0.1:3000 # Optionnel si même URL
```

## 📞 Support

Si problème avec Socket.IO, vérifier dans la console :
1. **Connexion réussie** : `🟢 Socket.IO connecté: xxx`
2. **Token valide** : Pas d'erreur "Authentication error"
3. **Événements reçus** : Console affiche les événements

En cas d'erreur d'authentification :
- Vérifier que le token JWT est valide
- Vérifier que le token est bien passé dans `auth: { token }`
- Vérifier que l'utilisateur a un `organization_id`
