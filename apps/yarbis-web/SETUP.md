# Configuración de Yarbis Chatbot

Este documento guía la configuración completa del chatbot Yarbis con todas las integraciones de API.

## 1. Configuración Inicial

### 1.1 Variables de Entorno

Copia `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Luego edita `.env.local` con tus claves de API.

## 2. Anthropic API (Claude)

### Obtener API Key

1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Navega a **API Keys** en el menú lateral
4. Haz clic en **Create Key**
5. Copia la clave y agrégala a `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

## 3. Deepgram API (Transcripción de Voz)

Deepgram proporciona transcripción rápida y precisa de audio a texto, especialmente buena para español.

### Obtener API Key

1. Ve a https://console.deepgram.com/
2. Crea una cuenta gratuita
3. Ve a **API Keys** en el dashboard
4. Haz clic en **Create New API Key**
5. Selecciona permissions de "Transcription" (lectura)
6. Copia la clave y agrégala a `.env.local`:

```env
DEEPGRAM_API_KEY=xxxxxxxxxxxxx
```

### Características Incluidas

- ✅ Transcripción en tiempo real
- ✅ Soporte para español (es)
- ✅ Puntuación automática
- ✅ Tier gratuito generoso (25k minutos/mes)

## 4. Google APIs Setup

Todas las integraciones de Google requieren OAuth2. Aquí está cómo configurarlas:

### 4.1 Crear Proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Haz clic en el proyecto dropdown en la parte superior
3. Selecciona **NEW PROJECT**
4. Ingresa "Yarbis Club Juntos" como nombre
5. Haz clic en **CREATE**

### 4.2 Habilitar APIs Necesarias

Una vez creado el proyecto:

1. Ve a **APIs & Services** > **Library**
2. Busca y habilita cada una:
   - **Google Drive API** - Para crear carpetas y subir archivos
   - **Gmail API** - Para enviar emails
   - **Google Sheets API** - Para crear planillas
   - **Notion API** (opcional) - Integraciones avanzadas

Haz clic en cada una y selecciona **ENABLE**.

### 4.3 Crear Credenciales OAuth2

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Si te pide crear una pantalla de consentimiento:
   - Selecciona **User Type: External**
   - Completa la información básica
   - En scopes, agréganos las APIs habilitadas
   - Continúa hasta completar

4. Crea el cliente OAuth:
   - Selecciona **Application Type: Web application**
   - Agréganos los Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     http://localhost:3001/api/auth/google/callback
     https://tu-dominio.com/api/auth/google/callback
     ```
   - Haz clic en **CREATE**

5. Copia las credenciales:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 4.4 Configurar en .env.local

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
NEXT_PUBLIC_CLAUDE_API_BASE=http://localhost:3000
```

## 5. Slack Integration (Opcional)

### 5.1 Crear Webhook de Slack

1. Ve a https://api.slack.com/apps
2. Haz clic en **Create New App** > **From scratch**
3. Ingresa "Yarbis" como nombre
4. Selecciona tu workspace de Slack
5. Ve a **Incoming Webhooks** en el menú lateral
6. Activa **Incoming Webhooks**
7. Haz clic en **Add New Webhook to Workspace**
8. Selecciona un canal (ej: #general)
9. Autoriza la integración
10. Copia la URL del webhook y agrégala a `.env.local`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

## 6. Notion Integration (Opcional)

### 6.1 Crear Integración de Notion

1. Ve a https://www.notion.so/my-integrations
2. Haz clic en **New integration**
3. Ingresa "Yarbis" como nombre
4. Selecciona capacidades necesarias
5. Copia el token y agrégalo a `.env.local`:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxx
```

6. En Notion, comparte tu base de datos con la integración

## 7. Instalar Dependencias

```bash
cd apps/yarbis-web
npm install
```

## 8. Ejecutar en Desarrollo

```bash
npm run dev
```

El chatbot estará disponible en http://localhost:3000

## 9. Testing del Chatbot

### Pruebas de Texto

1. Escribe: "Ingresar alumno nuevo"
2. Escribe: "Juan García, 45123456, juan@gmail.com, 1123456789, 15/05/2010"
3. Verifica que el alumno fue creado

### Pruebas de Voz

1. Haz clic en el botón 🎤
2. Habla claro: "Ingresar alumno nuevo"
3. Espera transcripción y respuesta de Yarbis

### Pruebas de Integración

1. **Google Drive**: "Ingresar alumno nuevo" crea una carpeta en Drive
2. **Gmail**: El email de confirmación se envía al estudiante
3. **Sheets**: Los datos se guardan en planillas Google

## 10. Troubleshooting

### Error: "Deepgram API key not configured"
- Verifica que `DEEPGRAM_API_KEY` está en `.env.local`
- Reinicia el servidor: `npm run dev`

### Error: "Failed to transcribe audio"
- Verifica la calidad del audio
- Chequea logs en la consola del navegador
- Asegúrate que Deepgram está habilitado en .env.local

### Error: "Google APIs error"
- Verifica que las APIs están habilitadas en Google Cloud Console
- Chequea que los scopes OAuth incluyen las APIs necesarias
- Revisa que el refresh token es válido

### Voice no funciona en Firefox
- Firefox requiere HTTPS para acceder al micrófono
- En desarrollo, localhost:3000 debería funcionar
- En producción, asegúrate de tener HTTPS

## 11. Deployment

### Vercel (Recomendado)

1. Push a GitHub:
   ```bash
   git push origin claude/yarbis-ironman-yor08q
   ```

2. Ve a https://vercel.com
3. Importa el repositorio
4. Configura las variables de entorno en Settings > Environment Variables
5. Deploy

### Notas de Producción

- Nunca commites `.env.local` (está en .gitignore)
- Usa variables de entorno secretas en tu plataforma de hosting
- Configura URLs de callback correctas para OAuth
- Habilita HTTPS en producción

## 12. Documentación de APIs

- [Deepgram API Docs](https://developers.deepgram.com/)
- [Google Drive API](https://developers.google.com/drive/api)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Notion API](https://developers.notion.com/)

## Soporte

Si encuentras problemas:

1. Chequea que todas las claves están en `.env.local`
2. Verifica los logs en la consola del navegador (F12)
3. Verifica los logs del servidor (npm run dev output)
4. Asegúrate de tener conexión a internet

¡Listo! Tu chatbot Yarbis está completamente configurado. 🎉
