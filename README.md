# FleetWatch 🚚

Plataforma web de monitoreo de flotas vehiculares en tiempo real con mapa interactivo, geocercas, alertas y reportes.

## 🚀 Características

- **Dashboard en tiempo real**: Monitoreo de vehículos con KPIs dinámicos
- **Sistema de autenticación**: Login con roles (Superuser, Admin, Cliente)
- **Gestión de vehículos**: CRUD completo con estados en tiempo real
- **Notificaciones en vivo**: WebSocket simulado para actualizaciones instantáneas
- **Responsive Design**: Mobile-first con TailwindCSS
- **TypeScript**: Type-safe en todo el proyecto

## 🛠️ Stack Tecnológico

- **React 18** - UI Library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching & caching
- **Zustand** - State management (preparado)
- **MapLibre GL** - Maps (por implementar)
- **Socket.io** - WebSocket (mock implementado)
- **Lucide React** - Icons

## 📦 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
cd fleetwatch
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5173
```

## 🔐 Usuarios de Prueba

### Superuser (modo dios)
- **Email**: `julio@fleetwatch.com`
- **Password**: `julio123`
- **Permisos**: Acceso total, puede gestionar admins y clientes

### Admin
- **Email**: `admin@fleetwatch.com`
- **Password**: `admin123`
- **Permisos**: Gestión de vehículos, clientes, reportes

### Cliente (visor)
- **Email**: `cliente@fleetwatch.com`
- **Password**: `cliente123`
- **Permisos**: Solo visualización de vehículos asignados

## 📁 Estructura del Proyecto

```
fleetwatch/
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
│   │   └── Layout.tsx          # Layout principal con header
│   ├── features/               # Features por dominio
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── guard.tsx
│   │   └── vehicles/
│   │       └── api.ts
│   ├── pages/                  # Páginas principales
│   │   ├── HomePage.tsx
│   │   ├── VehiclesPage.tsx
│   │   ├── ClientsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   └── RolesPage.tsx
│   ├── lib/                    # Utilidades y configuración
│   │   ├── types.ts            # Tipos TypeScript
│   │   ├── constants.ts        # Constantes de la app
│   │   ├── utils.ts            # Funciones helper
│   │   ├── apiClient.ts        # Cliente HTTP
│   │   ├── ws.ts               # Cliente WebSocket
│   │   ├── mocks.ts            # Datos de prueba
│   │   └── mockWebSocket.ts    # WebSocket simulado
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                        # Variables de entorno
├── tailwind.config.js          # Configuración de Tailwind
├── tsconfig.json               # Configuración de TypeScript
└── package.json
```

## 🎨 Configuración de Tailwind

El proyecto usa un tema personalizado con colores específicos:

- **Primary**: `#1fb6aa` (Verde azulado)
- **Info**: `#0ea5e9` (Azul)
- **OK**: `#10b981` (Verde)
- **Warn**: `#f59e0b` (Naranja)
- **Crit**: `#ef4444` (Rojo)

## 🔄 Próximos Pasos

### Implementaciones Pendientes

1. **Mapa con MapLibre GL**
   - Integrar mapa interactivo
   - Mostrar vehículos en tiempo real
   - Geocercas visuales
   - Filtros en el mapa

2. **Dashboard con Drag & Drop**
   - Usar `@hello-pangea/dnd` o `react-grid-layout`
   - Persistir layout por usuario
   - Cards reordenables

3. **WebSocket Real**
   - Conectar con servidor WebSocket real
   - Actualizar posiciones de vehículos
   - Notificaciones en tiempo real

4. **Notificaciones**
   - Store de notificaciones con Zustand
   - Marcar como leído
   - Filtros por tipo

5. **Reportes**
   - Generación de reportes
   - Export a CSV/Excel
   - Filtros avanzados

6. **Geocercas**
   - CRUD de geocercas
   - Dibujo en mapa
   - Alertas de entrada/salida

## 🔌 Conexión con API Real

Para conectar con una API real, modifica los archivos en `src/features/*/api.ts`:

```typescript
// Ejemplo en features/vehicles/api.ts
export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    // Reemplazar mock con llamada real
    return apiClient.get<Vehicle[]>('/vehicles');
  },
};
```

Configurar la URL de la API en `.env`:
```
VITE_API_URL=https://tu-api.com
```

## 📝 Scripts Disponibles

```bash
# Desarrollo (frontend + backend)
npm run dev

# Solo frontend
npm run dev:client

# Solo backend
npm run dev:server

# Build frontend para producción
npm run build

# Build backend para producción
npm run build:server

# Iniciar servidor en producción
npm start

# Preview de build
npm run preview

# Lint
npm run lint
```

## 🚀 Deployment en Railway

### 1. Crear cuenta en Railway

Ve a [railway.app](https://railway.app) y crea una cuenta (puedes usar GitHub).

### 2. Preparar el proyecto

Ya está preparado con:
- ✅ Script `start` en `package.json`
- ✅ Variables de entorno configuradas
- ✅ `.gitignore` actualizado
- ✅ CORS configurado dinámicamente

### 3. Subir a GitHub

```bash
# Inicializar git si no lo has hecho
git init
git add .
git commit -m "Deploy: preparar proyecto para Railway"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/fleetwatch.git
git branch -M main
git push -u origin main
```

### 4. Desplegar en Railway

1. **Crear nuevo proyecto**:
   - Click en "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio `fleetwatch`

2. **Configurar variables de entorno**:
   En el dashboard de Railway, ve a "Variables" y agrega:
   ```
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```

3. **Configurar el comando de inicio**:
   Railway detectará automáticamente el `start` script, pero si necesitas ajustarlo:
   - Ve a "Settings" → "Deploy"
   - Start Command: `npm start`
   - Build Command: `npm run build:server && npm run build`

4. **Deploy**:
   - Railway desplegará automáticamente
   - Obtendrás una URL como: `https://tu-proyecto.up.railway.app`

### 5. Desplegar Frontend (Vercel - Recomendado)

El frontend debe desplegarse por separado:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd fleetwatch
vercel
```

Configurar variables de entorno en Vercel:
```
VITE_API_URL=https://tu-backend.up.railway.app
VITE_WS_URL=wss://tu-backend.up.railway.app
VITE_APP_NAME=FleetWatch
```

### 6. Actualizar CORS

Una vez tengas la URL del frontend, actualiza en Railway:
```
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 🌍 URLs de Producción

Después del deployment:
- **Backend**: `https://tu-proyecto.up.railway.app`
- **Frontend**: `https://tu-proyecto.vercel.app`
- **API Docs**: `https://tu-proyecto.up.railway.app/api/`

## ⚠️ Notas Importantes para Producción

### Base de Datos
- Actualmente usa SQLite (archivo local)
- Para producción seria, considera migrar a PostgreSQL:
  ```bash
  # En Railway, agregar PostgreSQL
  # Actualizar código para usar pg en lugar de better-sqlite3
  ```

### Seguridad
- Cambiar autenticación mock por JWT real
- Implementar rate limiting
- Agregar helmet.js para seguridad HTTP
- Usar HTTPS en producción (Railway lo provee automáticamente)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es un MVP de demostración.

## 👨‍💻 Autor

Desarrollado con ❤️ para FleetWatch

---

**Nota**: Este es un MVP con datos mock. Para producción, conectar con API real y agregar las features pendientes.
