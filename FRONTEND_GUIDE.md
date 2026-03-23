# agenteDashboard - Comunicación con Otros Servicios

## 🎯 Rol en el Sistema

**agenteDashboard** es el **panel de agentes web** del sistema. Es la interfaz que utilizan los agentes para:
- Recibir y gestionar conversaciones en tiempo real
- Responder mensajes de múltiples canales digitales
- Guardar y finalizar folios (conversaciones)
- Transferir conversaciones entre agentes
- Ver estadísticas personales (TMO, contadores)
- Gestionar actividades y reportes

**Tecnologías**: React 18 + HeroUI + Socket.IO Client + Axios

## 🔌 Servicios con los que se Comunica

### 1. **centralita** (API Gateway Principal)

**Protocolos**: 
- HTTP/REST (solicitudes síncronas)
- WebSocket/Socket.IO (eventos en tiempo real)

**Puerto**: 3031 (configurable)  
**Autenticación**: JWT Bearer Token

#### ¿Para qué se comunica?

**HTTP/REST**:
- ✅ Autenticación (login de agente)
- ✅ Consultar folios asignados
- ✅ Enviar mensajes
- ✅ Guardar folios
- ✅ Finalizar folios
- ✅ Transferir folios entre agentes
- ✅ Consultar estadísticas del agente
- ✅ Gestionar actividades

**WebSocket/Socket.IO**:
- ✅ Recibir nuevos mensajes en tiempo real
- ✅ Recibir asignación de folios
- ✅ Recibir actualizaciones de estado de folios
- ✅ Recibir notificaciones
- ✅ Actualizar estadísticas en tiempo real
- ✅ Notificar presencia del agente (online/offline)

---

### Cliente HTTP Centralizado

```javascript
// src/controladores/DataStorage.js
import axios from 'axios';

const baseUrl = process.env.REACT_APP_CENTRALITA;

class DataStorage {
  // GET request
  static async get(path) {
    const token = localStorage.getItem('token');
    
    const response = await axios.get(`${baseUrl}${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  // POST request
  static async post(path, data) {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(`${baseUrl}${path}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  // PUT request
  static async put(path, data) {
    const token = localStorage.getItem('token');
    
    const response = await axios.put(`${baseUrl}${path}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
}

export default DataStorage;
```

---

### Cliente WebSocket

```javascript
// src/controladores/Socket.js
import io from 'socket.io-client';

const baseUrl = process.env.REACT_APP_CENTRALITA;

class SocketClient {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }
  
  // Conectar al servidor
  connect() {
    const token = localStorage.getItem('token');
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      
      // Unirse al room del servicio
      const serviceId = localStorage.getItem('serviceId');
      this.socket.emit('joinService', { serviceId });
      
      // Notificar que el agente está online
      const agentId = localStorage.getItem('userId');
      this.socket.emit('agentOnline', { agentId });
    });
    
    this.socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });
    
    this.setupListeners();
  }
  
  // Configurar listeners de eventos
  setupListeners() {
    // Nuevo mensaje en folio
    this.socket.on('newMessage', (data) => {
      console.log('📨 Nuevo mensaje:', data);
      if (this.listeners.newMessage) {
        this.listeners.newMessage(data);
      }
    });
    
    // Folio asignado al agente
    this.socket.on('folioAssigned', (data) => {
      console.log('📋 Folio asignado:', data);
      if (this.listeners.folioAssigned) {
        this.listeners.folioAssigned(data);
      }
    });
    
    // Estado de folio cambió
    this.socket.on('folioStatusChanged', (data) => {
      console.log('🔄 Estado de folio cambió:', data);
      if (this.listeners.folioStatusChanged) {
        this.listeners.folioStatusChanged(data);
      }
    });
    
    // Actualización de estadísticas
    this.socket.on('analytics:update', (data) => {
      console.log('📊 Actualización de estadísticas:', data);
      if (this.listeners.analyticsUpdate) {
        this.listeners.analyticsUpdate(data);
      }
    });
  }
  
  // Registrar listener
  on(event, callback) {
    this.listeners[event] = callback;
  }
  
  // Emitir evento
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
  
  // Desconectar
  disconnect() {
    if (this.socket) {
      const agentId = localStorage.getItem('userId');
      this.socket.emit('agentOffline', { agentId });
      this.socket.disconnect();
    }
  }
}

const socketClient = new SocketClient();
export default socketClient;
```

---

### Endpoints HTTP Consumidos

#### **Autenticación**
- `POST /agent/login` - Login de agente
  ```javascript
  const response = await DataStorage.post('/agent/login', {
    email: 'agente@example.com',
    password: 'password123'
  });
  // response = { success: true, token: '...', user: {...} }
  ```

#### **Folios (Conversaciones)**
- `GET /agent/folios` - Folios del agente
- `GET /folio/:id` - Detalles de folio
- `POST /folio/message` - Enviar mensaje
- `POST /folio/save` - Guardar folio
- `POST /folio/finalize` - Finalizar folio
- `POST /folio/transfer` - Transferir folio
- `POST /folio/assign` - Asignar folio

#### **Estadísticas**
- `GET /stats/agents/:agentId` - Estadísticas del agente
- `GET /stats/agents/:agentId/daily` - Estadísticas diarias

#### **Actividades**
- `GET /service/:serviceId/activities` - Actividades del servicio
- `POST /service/:serviceId/activity` - Crear actividad
- `PUT /service/:serviceId/activity/:activityId` - Actualizar actividad

#### **Otros**
- `GET /service/:id` - Información del servicio
- `GET /agent/profile` - Perfil del agente
- `PUT /agent/profile` - Actualizar perfil

---

### Eventos WebSocket

#### **Eventos que Escucha el Agente**

**newMessage**
```javascript
socket.on('newMessage', (data) => {
  // data = {
  //   folioId: 'folioId',
  //   message: { text: 'Hola', from: 'user', timestamp: '...' },
  //   channel: 'whatsapp'
  // }
  
  // Actualizar UI con nuevo mensaje
  updateFolioMessages(data.folioId, data.message);
  
  // Mostrar notificación
  showNotification('Nuevo mensaje');
});
```

**folioAssigned**
```javascript
socket.on('folioAssigned', (data) => {
  // data = {
  //   folio: { _id: '...', person: {...}, channel: {...} },
  //   agentId: 'agentId'
  // }
  
  // Agregar folio a la lista
  addFolioToList(data.folio);
  
  // Mostrar notificación
  showNotification('Nuevo folio asignado');
});
```

**folioStatusChanged**
```javascript
socket.on('folioStatusChanged', (data) => {
  // data = {
  //   folioId: 'folioId',
  //   oldStatus: 10,
  //   newStatus: 20
  // }
  
  // Actualizar estado del folio en UI
  updateFolioStatus(data.folioId, data.newStatus);
});
```

**analytics:update**
```javascript
socket.on('analytics:update', (data) => {
  // data = {
  //   type: 'tmo_updated',
  //   agentId: 'agentId',
  //   newTMO: 180000
  // }
  
  // Actualizar widget de estadísticas
  updateStatsWidget(data);
});
```

#### **Eventos que Emite el Agente**

**joinService**
```javascript
socket.emit('joinService', { 
  serviceId: localStorage.getItem('serviceId') 
});
```

**agentOnline**
```javascript
socket.emit('agentOnline', { 
  agentId: localStorage.getItem('userId') 
});
```

**agentOffline**
```javascript
socket.emit('agentOffline', { 
  agentId: localStorage.getItem('userId') 
});
```

**typing**
```javascript
socket.emit('typing', { 
  folioId: 'folioId',
  agentId: 'agentId'
});
```

---

## 📊 Diagrama de Comunicación

```
┌─────────────────────────────────────────────────────────┐
│                  agenteDashboard                        │
│              (Panel de Agentes Web)                     │
│          React 18 + HeroUI + Socket.IO                  │
│                    Puerto: 3001                         │
└────────────┬──────────────────────┬─────────────────────┘
             │                      │
             │ HTTP/REST            │ WebSocket
             │ (Síncronas)          │ (Tiempo Real)
             │                      │
             ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                     centralita                          │
│                  (API Gateway Principal)                │
│                      Puerto: 3031                       │
│                                                         │
│  HTTP Endpoints:          WebSocket Events:            │
│  - /agent/login           - newMessage                 │
│  - /agent/folios          - folioAssigned              │
│  - /folio/message         - folioStatusChanged         │
│  - /folio/save            - analytics:update           │
│  - /folio/finalize        - agentOnline                │
│  - /stats/agents          - agentOffline               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujos de Comunicación Típicos

### Flujo 1: Login de Agente

```
1. Agente ingresa email y password en Login.js
2. agenteDashboard → POST /agent/login (centralita)
   Body: { email, password }
3. centralita → sessions (validar credenciales de agente)
4. centralita → agenteDashboard
   Response: { success: true, token: '...', user: {...} }
5. agenteDashboard → localStorage.setItem('token', token)
6. agenteDashboard → Socket.connect()
7. agenteDashboard → socket.emit('joinService', { serviceId })
8. agenteDashboard → socket.emit('agentOnline', { agentId })
9. agenteDashboard → Redirect a /home
```

### Flujo 2: Recibir Nuevo Mensaje (Tiempo Real)

```
1. Usuario final envía mensaje por WhatsApp
2. WhatsApp API → POST /incoming/wabacloudapi (centralita)
3. centralita → dataStorage (guardar mensaje)
4. centralita → Socket.IO → agenteDashboard
   Event: 'newMessage'
   Data: { folioId, message, channel }
5. agenteDashboard → Actualizar UI con nuevo mensaje
6. agenteDashboard → Mostrar notificación
7. agenteDashboard → Reproducir sonido (opcional)
```

### Flujo 3: Agente Responde Mensaje

```
1. Agente escribe mensaje en Home.js
2. agenteDashboard → POST /folio/message (centralita)
   Body: { folioId, message: { text: '...', from: 'agent' } }
   Header: Authorization: Bearer <token>
3. centralita → dataStorage (guardar mensaje)
4. centralita → Plugin del canal (enviar a WhatsApp, etc.)
5. centralita → Socket.IO → agenteDashboard
   Event: 'messageSent'
   Data: { folioId, message, status: 'sent' }
6. agenteDashboard → Actualizar UI (mensaje enviado)
```

### Flujo 4: Guardar Folio

```
1. Agente hace click en "Guardar" en Home.js
2. agenteDashboard → POST /folio/save (centralita)
   Body: { folioId, agentId }
3. centralita → dataStorage (actualizar folio)
4. dataStorage → Stats.js (registrar evento folio:save)
5. dataStorage → Calcular TMO
6. dataStorage → RabbitMQ analytics_updates
7. centralita → Socket.IO → agenteDashboard
   Event: 'analytics:update'
   Data: { type: 'tmo_updated', newTMO: 180000 }
8. agenteDashboard → Actualizar widget de TMO
```

### Flujo 5: Finalizar Folio

```
1. Agente hace click en "Finalizar" en Home.js
2. agenteDashboard → POST /folio/finalize (centralita)
   Body: { folioId, classification, notes }
3. centralita → dataStorage (actualizar folio status=30)
4. dataStorage → Stats.js (registrar evento folio:finalize)
5. centralita → Socket.IO → agenteDashboard
   Event: 'folioStatusChanged'
   Data: { folioId, oldStatus: 20, newStatus: 30 }
6. agenteDashboard → Remover folio de lista activa
7. agenteDashboard → Mostrar mensaje de éxito
```

### Flujo 6: Transferir Folio

```
1. Agente selecciona otro agente en modal de transferencia
2. agenteDashboard → POST /folio/transfer (centralita)
   Body: { folioId, fromAgentId, toAgentId }
3. centralita → dataStorage (actualizar folio.agent)
4. centralita → Socket.IO → agenteDashboard (agente actual)
   Event: 'folioStatusChanged'
5. centralita → Socket.IO → agenteDashboard (agente destino)
   Event: 'folioAssigned'
6. Ambos agentes actualizan sus listas
```

---

## 🛠️ Configuración

### Variables de Entorno

```bash
# .env
REACT_APP_CENTRALITA=http://localhost:3031

# Para producción
REACT_APP_CENTRALITA=https://api.midominio.com
```

### Inicialización de la App

```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </React.StrictMode>
);
```

### Inicialización de Socket.IO

```javascript
// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import socketClient from './controladores/Socket';
import Home from './views/home/Home';
import Login from './views/login/Login';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Conectar socket si hay token
      socketClient.connect();
      
      // Cleanup al desmontar
      return () => {
        socketClient.disconnect();
      };
    }
  }, []);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        {/* Más rutas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎨 Componentes Principales

### Home.js
- Vista principal de conversaciones
- Lista de folios asignados
- Chat en tiempo real
- Envío de mensajes
- Guardar/finalizar folios

### StatsDashboard.js
- Estadísticas del agente
- TMO promedio del día
- Contadores por canal
- Gráficos de actividad

### Activities.js
- Gestión de actividades del agente
- Registro de tiempo
- Reportes de actividades

### Login.js
- Autenticación de agente
- Almacena token
- Conecta socket
- Redirect a home

---

## 📝 Manejo de Estado

### localStorage
```javascript
// Guardar token
localStorage.setItem('token', token);

// Guardar userId (agentId)
localStorage.setItem('userId', userId);

// Guardar serviceId
localStorage.setItem('serviceId', serviceId);

// Obtener token
const token = localStorage.getItem('token');

// Eliminar token (logout)
localStorage.removeItem('token');
```

### React State para Folios
```javascript
// En Home.js
const [folios, setFolios] = useState([]);
const [activeFolio, setActiveFolio] = useState(null);
const [messages, setMessages] = useState([]);

// Cargar folios
useEffect(() => {
  loadFolios();
}, []);

const loadFolios = async () => {
  const response = await DataStorage.get('/agent/folios');
  if (response.success) {
    setFolios(response.folios);
  }
};

// Escuchar nuevos mensajes
useEffect(() => {
  socketClient.on('newMessage', (data) => {
    if (data.folioId === activeFolio?._id) {
      setMessages(prev => [...prev, data.message]);
    }
  });
}, [activeFolio]);
```

---

## 🔍 Debugging

### Ver requests HTTP
```javascript
// En componente
console.log('🌐 Calling:', url, payload);

const response = await DataStorage.post(url, payload);
console.log('📦 Response:', response);
```

### Ver eventos Socket.IO
```javascript
// En Socket.js
this.socket.onAny((event, ...args) => {
  console.log('📡 Socket event:', event, args);
});
```

### Verificar conexión Socket
```javascript
// En componente
useEffect(() => {
  if (socketClient.socket) {
    console.log('✅ Socket conectado:', socketClient.socket.id);
  } else {
    console.log('❌ Socket no conectado');
  }
}, []);
```

---

## 📝 Notas Importantes

### Autenticación
- Token JWT almacenado en localStorage
- Token enviado en header `Authorization: Bearer <token>`
- Token también usado para autenticar socket
- Redirect a login si token inválido (401)

### Tiempo Real
- Socket.IO para eventos en tiempo real
- Reconexión automática si se pierde conexión
- Rooms por servicio para eventos específicos
- Notificaciones visuales y sonoras

### Performance
- Lazy loading de componentes
- Virtualización de listas largas
- Debounce en búsquedas
- Optimización de renders con React.memo

### Diseño
- **UI Library**: HeroUI (migrado de Semantic UI)
- **Tema**: Claro con vidrio esmerilado
- **Iconos**: Heroicons + React Icons
- **Estilos**: Tailwind CSS
- **Animaciones**: Framer Motion

### Notificaciones
- Notificaciones del navegador (Notification API)
- Sonidos para nuevos mensajes
- Badges en título de página
- Vibración en móviles (si soportado)

---

## 🚀 Comandos

```bash
# Desarrollo
npm start

# Build para producción
npm run build

# Servir build
npx serve -s build
```

---

## 🔔 Sistema de Notificaciones

### Notificaciones del Navegador

```javascript
// Solicitar permiso
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Mostrar notificación
const showNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'new-message'
    });
  }
};

// Uso en evento de socket
socketClient.on('newMessage', (data) => {
  showNotification(
    'Nuevo mensaje',
    `${data.person.name}: ${data.message.text}`
  );
});
```

### Sonido de Notificación

```javascript
// Reproducir sonido
const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.play().catch(err => {
    console.error('Error reproduciendo sonido:', err);
  });
};
```

---

**Última actualización**: 2025-03-23  
**Versión**: 1.0
