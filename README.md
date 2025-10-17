# ReportNow 🚚 - Frontend Standalone

Plataforma web de monitoreo de flotas vehiculares en tiempo real con mapa interactivo, geocercas, alertas y reportes.

**Versión Frontend Standalone**: Este proyecto contiene únicamente el frontend con datos mock integrados, ideal para desarrollo y demostración sin necesidad de backend.

## 🚀 Características

- **Dashboard en tiempo real**: Monitoreo de vehículos con KPIs dinámicos
- **Sistema de autenticación**: Login con roles (Superuser, Admin, Cliente)
- **Gestión de vehículos**: CRUD completo con estados en tiempo real
- **Datos Mock Integrados**: Funciona sin servidor backend
- **Responsive Design**: Mobile-first con TailwindCSS
- **TypeScript**: Type-safe en todo el proyecto
- **Mapa Interactivo**: Con Leaflet y React Leaflet
- **Geocercas**: Visualización y gestión de zonas

## 🛠️ Stack Tecnológico

- **React 19** - UI Library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS v4** - Styling
- **React Router v7** - Routing
- **TanStack React Query v5** - Data fetching & caching
- **Zustand** - State management
- **Leaflet + React Leaflet** - Maps
- **Lucide React** - Icons
- **Recharts** - Gráficas
- **Date-fns** - Manejo de fechas

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar o descargar el repositorio**
```bash
cd reportnow
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:5173
```

## 🔐 Usuarios de Prueba

El proyecto incluye usuarios predefinidos en los datos mock:

### Superuser (acceso total)
- **Username**: `julio`
- **Password**: `admin123`
- **Permisos**: Acceso total, puede ver todos los vehículos y clientes

### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Permisos**: Gestión de vehículos, clientes, reportes

### Cliente (vista limitada)
- **Username**: `contacto`
- **Password**: `123`
- **Permisos**: Solo visualización de vehículos asignados al cliente "Transportes del Valle"

### Cliente 2
- **Username**: `cliente2`
- **Password**: `123`
- **Permisos**: Solo visualización de vehículos de "Express Jalisco"

## 📁 Estructura del Proyecto

```
reportnow/
├── src/
│   ├── app/                    # Configuración de la app
│   │   ├── providers.tsx       # React Query, Router
│   │   └── routes.tsx          # Definición de rutas
│   ├── components/
│   │   ├── ui/                 # Componentes UI reutilizables
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Input.tsx
│   │   ├── map/                # Componentes de mapa
│   │   └── Layout.tsx          # Layout principal
│   ├── features/               # Features por dominio
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── api.ts          # API mock de autenticación
│   │   │   ├── hooks.ts
│   │   │   └── guard.tsx
│   │   ├── vehicles/
│   │   │   └── api.ts          # API mock de vehículos
│   │   ├── clients/
│   │   │   └── api.ts          # API mock de clientes
│   │   ├── geofences/
│   │   │   └── api.ts          # API mock de geocercas
│   │   ├── notifications/
│   │   │   └── api.ts          # API mock de notificaciones
│   │   └── users/
│   │       └── api.ts          # API mock de usuarios
│   ├── data/                   # 🆕 Datos mock
│   │   └── mockData.ts         # Datos de prueba integrados
│   ├── pages/                  # Páginas principales
│   │   ├── HomePage.tsx
│   │   ├── VehicleDetailPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── GeofencesPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── ReportsPage.tsx
│   ├── lib/                    # Utilidades y configuración
│   │   ├── types.ts            # Tipos TypeScript
│   │   ├── constants.ts        # Constantes de la app
│   │   └── utils.ts            # Funciones helper
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tailwind.config.js          # Configuración de Tailwind
├── tsconfig.json               # Configuración de TypeScript
├── vite.config.ts              # Configuración de Vite
└── package.json
```

## 🎨 Configuración de Tailwind

El proyecto usa un tema personalizado con colores específicos:

- **Primary**: `#1fb6aa` (Verde azulado)
- **Info**: `#0ea5e9` (Azul)
- **OK**: `#10b981` (Verde)
- **Warn**: `#f59e0b` (Naranja)
- **Crit**: `#ef4444` (Rojo)

## 📊 Datos Mock Incluidos

El proyecto incluye datos de prueba realistas:

- **15 Vehículos** distribuidos entre 5 clientes
- **5 Clientes** (transportistas de Guadalajara, Jalisco)
- **4 Usuarios** con diferentes roles
- **5 Geocercas** predefinidas
- **8 Notificaciones** de ejemplo
- **Historial de rutas** para los últimos 7 días
- **Eventos de vehículos** (alertas de combustible, temperatura, etc.)

Todos los datos se encuentran en `src/data/mockData.ts` y pueden ser modificados fácilmente.

## 🔄 Funcionalidades Implementadas

### ✅ Autenticación
- Login con validación
- Roles: superuser, admin, client
- Guard de rutas protegidas
- Persistencia de sesión en localStorage

### ✅ Dashboard
- KPIs dinámicos (vehículos en movimiento, detenidos, offline, críticos)
- Mapa interactivo con Leaflet
- Marcadores de vehículos con colores por estado
- Geocercas visualizadas en el mapa
- Lista de vehículos con paginación
- Panel de notificaciones recientes
- Filtros por estado, cliente y geocerca

### ✅ Gestión de Vehículos
- Vista de lista con todos los vehículos
- Detalle de vehículo con historial
- Visualización de rutas en mapa
- Eventos y alertas del vehículo
- Operaciones CRUD (simuladas)

### ✅ Gestión de Clientes
- Lista de clientes
- Vehículos asignados por cliente
- Geocercas del cliente
- Envío de alertas (simulado)

### ✅ Geocercas
- Visualización en mapa
- Creación y eliminación
- Tipos: zona permitida, zona restringida, punto de interés
- Alertas configurables (entrada, salida, ambas)

### ✅ Notificaciones
- Lista de notificaciones
- Marcar como leída
- Filtros por tipo (info, warn, crit)
- Notificaciones no leídas en header

### ✅ Gestión de Usuarios
- Lista de usuarios
- Creación y edición
- Asignación de vehículos
- Control de roles

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Lint
npm run lint
```

## 🔌 Integración con Backend Real

Este proyecto está diseñado para funcionar sin backend, pero puede conectarse fácilmente a uno:

### Pasos para integrar backend:

1. **Los archivos API ya están preparados**
   - Cada feature tiene su archivo `api.ts` en `src/features/*/api.ts`
   - Actualmente usan datos mock de `src/data/mockData.ts`

2. **Reemplazar las implementaciones mock**

   Por ejemplo, en `src/features/vehicles/api.ts`:

   ```typescript
   // ANTES (mock):
   import { mockVehicles } from '../../data/mockData';

   export const vehiclesApi = {
     getAll: async (): Promise<Vehicle[]> => {
       await delay(200);
       return [...mockVehicles];
     }
   };

   // DESPUÉS (con backend real):
   import { apiClient } from '../../lib/apiClient';

   export const vehiclesApi = {
     getAll: async (): Promise<Vehicle[]> => {
       const response = await apiClient.get<Vehicle[]>('/api/vehicles');
       return response.data;
     }
   };
   ```

3. **Configurar axios o fetch**

   Crear o actualizar `src/lib/apiClient.ts`:

   ```typescript
   import axios from 'axios';

   export const apiClient = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // Agregar token JWT a las peticiones
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

4. **Configurar variables de entorno**

   Crear archivo `.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3000
   ```

5. **Instalar dependencias necesarias**
   ```bash
   npm install axios
   # o si necesitas WebSocket real:
   npm install socket.io-client
   ```

## 🚀 Deployment

### Vercel (Recomendado para frontend)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

O conecta tu repositorio de GitHub directamente en [vercel.com](https://vercel.com)

### Netlify

1. Conecta tu repositorio en [netlify.com](https://netlify.com)
2. Configuración de build:
   - Build command: `npm run build`
   - Publish directory: `dist`

### GitHub Pages

```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Agregar al package.json:
"homepage": "https://tu-usuario.github.io/reportnow",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

## 🎯 Próximos Pasos (Sugerencias)

### Para el desarrollador de Backend:

1. **API REST requerida**:
   - `POST /api/auth/login` - Autenticación
   - `GET /api/vehicles` - Listar vehículos
   - `GET /api/vehicles/:id` - Detalle de vehículo
   - `POST /api/vehicles` - Crear vehículo
   - `PUT /api/vehicles/:id` - Actualizar vehículo
   - `DELETE /api/vehicles/:id` - Eliminar vehículo
   - Endpoints similares para: clients, users, geofences, notifications

2. **WebSocket (opcional)**:
   - Eventos: `vehicle:updated`, `vehicle:created`, `vehicle:deleted`
   - Actualizaciones en tiempo real

3. **Base de datos sugerida**:
   - PostgreSQL o MySQL
   - Tablas: users, vehicles, clients, geofences, notifications, vehicle_history, vehicle_events

4. **Autenticación**:
   - JWT con refresh tokens
   - Roles: superuser, admin, client
   - Middleware de autenticación

### Para mejorar el Frontend:

1. **Agregar más features**:
   - Reportes exportables (PDF, Excel)
   - Dashboard personalizable
   - Gráficas avanzadas con Recharts
   - Notificaciones push

2. **Optimizaciones**:
   - Lazy loading de rutas
   - Virtualización de listas largas
   - Caché optimizado con React Query

3. **UX/UI**:
   - Modo oscuro
   - Más filtros y búsquedas
   - Animaciones con Framer Motion

## 🤝 Colaboración

Este proyecto está listo para compartir con el desarrollador de backend:

1. **Clona el repositorio** en GitHub
2. **Invita como colaborador** al desarrollador de backend
3. El backend puede:
   - Ver todas las estructuras de datos en `src/lib/types.ts`
   - Ver los datos mock en `src/data/mockData.ts`
   - Implementar las APIs según las interfaces en `src/features/*/api.ts`

## 📄 Licencia

Este proyecto es un MVP de demostración.

## 👨‍💻 Autor

Desarrollado para ReportNow

---

**Nota**: Este es un proyecto frontend standalone con datos mock. Perfecto para desarrollo, demostración y como base para integración con backend real.
