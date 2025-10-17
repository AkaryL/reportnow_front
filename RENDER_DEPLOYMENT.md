# Despliegue en Render

Este documento describe cómo desplegar el backend de FleetWatch en Render.

## Ventajas de Render

- Configuración más simple que Railway
- Plan gratuito generoso
- Despliegue automático desde GitHub
- SSL incluido gratis
- No requiere tarjeta de crédito para plan gratuito

## Pasos para el despliegue

### Método 1: Usando render.yaml (Recomendado - Más Rápido)

1. **Ve a https://render.com** y crea cuenta o inicia sesión

2. **Crea un nuevo Blueprint**:
   - Clic en "New" → "Blueprint"
   - Conecta tu cuenta de GitHub si no lo has hecho
   - Selecciona el repositorio `fletwatch-front`
   - Render detectará automáticamente el archivo `render.yaml`

3. **Configura las variables de entorno**:
   - `FRONTEND_URL`: URL de tu frontend (ejemplo: `https://tu-app.vercel.app`)
   - Las demás variables se configurarán automáticamente

4. **Haz clic en "Apply"** y Render comenzará el despliegue

### Método 2: Configuración manual

1. **Ve a https://render.com** y crea cuenta o inicia sesión

2. **Crea un nuevo Web Service**:
   - Clic en "New" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Selecciona el repositorio `fletwatch-front`

3. **Configura el servicio**:
   - **Name**: fleetwatch-backend (o el nombre que prefieras)
   - **Region**: Oregon (US West) o el más cercano a ti
   - **Branch**: main
   - **Root Directory**: fleetwatch (si tu proyecto está en una subcarpeta)
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm start`

4. **Selecciona el plan**: Free

5. **Configura las variables de entorno**:
   - Haz clic en "Advanced" → "Add Environment Variable"
   - Agrega estas variables:
     - `NODE_ENV` = `production`
     - `PORT` = `3000`
     - `JWT_SECRET` = (Render puede generar uno automático, o usa uno personalizado)
     - `FRONTEND_URL` = (URL de tu frontend en producción)

6. **Haz clic en "Create Web Service"**

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Ambiente de ejecución | `production` |
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Secreto para JWT | (auto-generado o personalizado) |
| `FRONTEND_URL` | URL del frontend para CORS | `https://tu-app.vercel.app` |

## Proceso de despliegue

1. Render clonará tu repositorio
2. Ejecutará `npm install` para instalar dependencias
3. Ejecutará `npm run build:server` para compilar TypeScript
4. Iniciará el servidor con `npm start`

## Base de datos SQLite

**Nota importante**: Render Free tier tiene almacenamiento efímero, lo que significa que la base de datos SQLite se perderá cuando el servicio se detenga o reinicie.

**Soluciones recomendadas**:
- Migrar a PostgreSQL (Render ofrece PostgreSQL gratuito)
- Usar un servicio de base de datos externo
- Para desarrollo/demo, SQLite funcionará pero los datos se perderán en cada despliegue

## Monitoreo

- **Logs en tiempo real**: En el dashboard de Render, ve a tu servicio → "Logs"
- **Métricas**: Ve a "Metrics" para ver CPU, memoria y ancho de banda
- **Eventos**: Ve a "Events" para ver historial de despliegues

## URL del servicio

Después del despliegue, Render te proporcionará una URL como:
```
https://fleetwatch-backend.onrender.com
```

Esta será la URL de tu API backend.

## Despliegues automáticos

Render desplegará automáticamente cada vez que hagas push a la rama `main` de tu repositorio.

Para desactivar esto:
- Ve a Settings → Build & Deploy
- Desactiva "Auto-Deploy"

## Solución de problemas

### El servicio no inicia
- Verifica los logs en el dashboard
- Asegúrate de que todas las variables de entorno estén configuradas
- Verifica que el build se completó correctamente

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurado correctamente
- Incluye el protocolo (https://)
- No incluyas barra al final

### El servicio está en "sleep" (plan gratuito)
- Los servicios gratuitos se duermen después de 15 minutos de inactividad
- Se reactivan automáticamente cuando reciben una petición (puede tardar 30-60 segundos)

## Actualizar a plan pagado

Si necesitas más recursos o almacenamiento persistente:
- Ve a Settings → Instance Type
- Selecciona un plan pagado ($7/mes en adelante)
- Los planes pagados incluyen almacenamiento persistente
