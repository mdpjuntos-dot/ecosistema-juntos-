# Yarbis Chatbot - Club Juntos 🤖

Asistente AI conversacional con voz para gestionar operaciones de Club Juntos. Maneja ingreso de alumnos, generación de recibos, seguimiento de pagos y más.

## ✨ Características Principales

- 🎤 **Entrada de Voz**: Graba y transcribe comandos usando Deepgram
- 💬 **Chat Conversacional**: Interfaz natural con personalidad Spanglish
- 👥 **Gestión de Alumnos**: Crear, consultar y listar estudiantes
- 💰 **Generación de Recibos**: Crear y rastrear pagos automáticamente
- 📊 **Reportes y Estadísticas**: Dashboard de métricas en tiempo real
- 🔗 **Integración Google**: Drive, Gmail, Sheets, Docs
- 💾 **Persistencia**: Base de datos con localStorage
- 🚀 **API Fallback**: Responde preguntas generales usando Claude API

## 🚀 Quick Start

### 1. Clonar y Configurar

```bash
cd apps/yarbis-web
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y agrega:
- `ANTHROPIC_API_KEY` - Tu clave de Anthropic
- `DEEPGRAM_API_KEY` - Tu clave de Deepgram
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` - Credenciales OAuth

Ver [SETUP.md](./SETUP.md) para instrucciones detalladas.

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 📚 Documentación

- **[SETUP.md](./SETUP.md)** - Configuración completa de APIs
- **[EXAMPLES.md](./EXAMPLES.md)** - Ejemplos de uso y comandos

## 🎯 Comandos Disponibles

### Alumnos
- `"Ingresar alumno nuevo"` - Crear nuevo estudiante
- `"Estado de [nombre]"` - Ver perfil del estudiante
- `"Todos los alumnos"` - Listar estudiantes activos

### Recibos
- `"Recibo para [nombre] de $[monto]"` - Generar recibo
- `"Recibos pendientes"` - Ver pagos pendientes

### Reportes
- `"Reportes"` - Ver estadísticas generales
- `"Ayuda"` - Ver referencia de comandos

## 🏗️ Arquitectura

```
apps/yarbis-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts       # Chat API endpoint
│   │   │   └── voice/route.ts      # Voice transcription endpoint
│   │   ├── page.tsx                # Main page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ChatWindow.tsx          # Main chat component
│   │   ├── ChatMessage.tsx         # Message display
│   │   ├── InputField.tsx          # Input with voice
│   │   └── VoiceInput.tsx          # Voice recording
│   └── lib/
│       ├── database.ts            # Persistent database
│       └── integrations.ts        # Google APIs integration
├── SETUP.md                       # Configuration guide
├── EXAMPLES.md                    # Usage examples
└── README.md                      # This file
```

## 🔌 Integraciones

### APIs Configuradas

- ✅ **Anthropic Claude** - LLM principal
- ✅ **Deepgram** - Transcripción de voz
- ✅ **Google Drive** - Almacenamiento de documentos
- ✅ **Gmail** - Envío de notificaciones
- ✅ **Google Sheets** - Almacenamiento de datos
- ✅ **Slack** (opcional) - Notificaciones
- ✅ **Notion** (opcional) - Base de datos

### Características de Integración

- Crear carpetas automáticamente en Google Drive por estudiante
- Enviar emails de confirmación y recibos
- Guardar datos en planillas Google Sheets
- Notificar eventos importantes en Slack
- Sincronizar datos con Notion

## 🛠️ Tecnologías

- **Frontend**: React 19, Next.js 15, Tailwind CSS
- **Backend**: Next.js API Routes
- **Hosting**: Vercel (recomendado)
- **Database**: localStorage (desarrollo), SQLite/Supabase (producción)
- **APIs**: Anthropic, Deepgram, Google Cloud, Slack, Notion

## 📝 Variables de Entorno Necesarias

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Deepgram (Voice Transcription)
DEEPGRAM_API_KEY=...

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# App Config
NEXT_PUBLIC_CLAUDE_API_BASE=http://localhost:3000
NODE_ENV=development
```

## 🎮 Uso

### Entrada de Texto
1. Escribe tu comando en la caja de entrada
2. Presiona Enter o haz clic en "✉️"
3. Yarbis responde automáticamente

### Entrada de Voz
1. Haz clic en el botón "🎤"
2. Habla tu comando (verás "🔴 Grabando")
3. Haz clic en "🔴 Grabando" para detener
4. Deepgram transcribe y Yarbis responde

### Acciones Rápidas
- Nuevo Alumno
- Recibos
- Alumnos
- Reportes

## 🚀 Deployment

### Vercel

1. Push a GitHub:
   ```bash
   git push origin claude/yarbis-ironman-yor08q
   ```

2. Conecta tu repositorio en Vercel
3. Configura variables de entorno
4. Deploy automático en cada push

### Notas
- Asegúrate de actualizar URLs de callback de OAuth
- Configura dominio personalizado si es necesario
- Revisa logs en Vercel dashboard

## 🐛 Troubleshooting

### Voice no funciona
- Verifica DEEPGRAM_API_KEY en .env.local
- Chequea permisos del micrófono en el navegador
- Asegúrate de usar HTTPS en producción

### Google APIs error
- Verifica credenciales OAuth en .env.local
- Confirma que las APIs están habilitadas en Google Cloud Console
- Chequea que los redirect URIs son correctos

### Chat no responde
- Verifica ANTHROPIC_API_KEY
- Chequea los logs en la consola del navegador (F12)
- Reinicia el servidor: `npm run dev`

## 📞 Soporte

Documentación detallada:
- [Guía de Configuración](./SETUP.md)
- [Ejemplos de Uso](./EXAMPLES.md)
- [API de Anthropic](https://docs.anthropic.com/)
- [API de Deepgram](https://developers.deepgram.com/)

## 📄 Licencia

Proyecto de Club Juntos - Todos los derechos reservados

---

**¿Listo para empezar?** Sigue la [Guía de Configuración](./SETUP.md) 🚀
