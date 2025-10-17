# Despliegue en Railway

Este documento describe cómo desplegar el backend de FleetWatch en Railway.

## Prerrequisitos

1. Cuenta en Railway (https://railway.app)
2. Railway CLI instalado (opcional, pero recomendado)
3. Git configurado

## Pasos para el despliegue

### Opción 1: Usando Railway CLI (Recomendado)

1. **Instalar Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login en Railway**
   ```bash
   railway login
   ```

3. **Inicializar proyecto**
   ```bash
   cd fleetwatch
   railway init
   ```

4. **Desplegar**
   ```bash
   railway up
   ```

5. **Configurar variables de entorno**
   ```bash
   railway variables set PORT=3000
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=tu-secreto-super-seguro-aqui
   railway variables set FRONTEND_URL=https://tu-frontend-url.com
   ```

### Opción 2: Usando la interfaz web de Railway

1. Ve a https://railway.app y crea una nueva cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio de GitHub
5. Railway detectará automáticamente el `nixpacks.toml` y `railway.json`
6. Configura las variables de entorno en el dashboard:
   - `PORT`: 3000
   - `NODE_ENV`: production
   - `JWT_SECRET`: un secreto fuerte y seguro
   - `FRONTEND_URL`: URL de tu frontend en producción

## Variables de entorno requeridas

Las siguientes variables de entorno deben configurarse en Railway:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto en el que correrá el servidor | `3000` |
| `NODE_ENV` | Ambiente de ejecución | `production` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `tu-secreto-super-seguro` |
| `FRONTEND_URL` | URL del frontend para CORS | `https://tu-app.vercel.app` |

## Archivos de configuración

- `railway.json`: Configuración específica de Railway
- `nixpacks.toml`: Configuración del builder Nixpacks
- `tsconfig.server.json`: Configuración de TypeScript para el servidor

## Proceso de build

El proceso de build en Railway ejecuta:

1. `npm ci` - Instala dependencias
2. `npm run build:server` - Compila TypeScript a JavaScript
3. `node dist/server/index.js` - Inicia el servidor

## Base de datos

El proyecto usa SQLite. Railway creará y mantendrá el archivo `fleetwatch.db` en el sistema de archivos persistente.

**Nota importante**: Railway proporciona almacenamiento persistente limitado. Para producción a gran escala, considera migrar a PostgreSQL o MySQL.

## Monitoreo y logs

- Accede a los logs en tiempo real desde el dashboard de Railway
- Los logs se actualizan automáticamente
- Puedes filtrar por nivel de log

## Solución de problemas

### El servidor no inicia
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build y deploy en Railway
- Asegúrate de que el archivo `dist/server/index.js` se generó correctamente

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Asegúrate de incluir el protocolo (https://)

### Error de base de datos
- Verifica que el volumen persistente esté montado
- La base de datos se crea automáticamente en el primer inicio

## URL del servidor

Después del despliegue, Railway te proporcionará una URL pública como:
```
https://tu-proyecto.up.railway.app
```

Esta será la URL de tu API backend.
