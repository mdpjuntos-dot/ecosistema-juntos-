# 🤖 Yarbis - Tu Asistente AI de Club Juntos

Yarbis es un asistente AI inteligente y con onda que simplifica la gestión completa de Club Juntos. Habla en Spanglish, maneja todas las skills de Club Juntos, y es tu compañero perfecto para:

- ✅ Ingresar y gestionar alumnos
- 💰 Generar recibos profesionales
- 📋 Completar formularios de obras sociales automáticamente
- 📊 Crear planillas de asistencia
- 🔄 Sincronizar todo con Google Drive, Gmail y Slack

## 🚀 Características

- **IA Conversacional**: Interfaz de chat natural con Claude
- **Personalidad Única**: Yarbis habla en Spanglish con un tono amigable pero profesional
- **Full-Stack**: Skill MCP backend + Web App React/Next.js
- **Integración Completa**: Google Drive, Gmail, Slack, Notion
- **Automatización**: Completa formularios y genera documentos automáticamente
- **Responsive**: Funciona en desktop y mobile

## 📁 Estructura del Proyecto

```
ecosistema-juntos-/
├── skills/
│   └── yarbis-assistant/          # Skill MCP (Python FastMCP)
│       ├── src/
│       │   ├── main.py             # Servidor MCP
│       │   ├── personality.py      # Personalidad Yarbis
│       │   ├── orchestrator.py     # Orquestador de skills
│       │   └── handlers.py         # Handlers específicos
│       └── pyproject.toml
│
├── apps/
│   └── yarbis-web/                 # Web App (Next.js + React)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx         # Página principal
│       │   │   ├── layout.tsx       # Layout raíz
│       │   │   ├── globals.css      # Estilos globales
│       │   │   └── api/
│       │   │       └── chat/        # API de chat
│       │   ├── components/          # Componentes React
│       │   └── lib/
│       │       └── types.ts         # TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       └── next.config.js
│
├── shared/
│   └── types.ts                    # Tipos compartidos
│
└── docs/
    ├── ARCHITECTURE.md             # Arquitectura completa
    └── SETUP.md                    # Guía de configuración
```

## 🛠️ Setup Rápido

### Requisitos
- Node.js 18+
- Python 3.10+
- API key de Anthropic (Claude)
- (Opcional) Cuentas de Google, Slack

### 1. Clonar y preparar
```bash
cd ecosistema-juntos-
npm install
cd apps/yarbis-web && npm install
```

### 2. Configurar variables de entorno
```bash
cp apps/yarbis-web/.env.local.example apps/yarbis-web/.env.local
# Edita .env.local y agrega tus keys
```

### 3. Ejecutar la web app
```bash
cd apps/yarbis-web
npm run dev
# Abre http://localhost:3000
```

### 4. Ejecutar el servidor MCP (opcional, para testing local)
```bash
cd skills/yarbis-assistant
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```

## 💬 Ejemplo de Uso

```
Usuario: "Ingresar alumno nuevo"
Yarbis: "¡Ey! Dale, vamos a ingresar un alumno nuevo" 
        [Abre formulario de intake]

Usuario: [Completa datos]
Yarbis: "¡Boom! Listo ✅ Alumno ingresado. ¿Generamos recibo?"

Usuario: "Sí, pero para Juan"
Yarbis: "Generando recibo para Juan..." 
        [Crea recibo, envía por email, sincroniza Drive]
        "¡Hecho, boludo! Recibo enviado ✅"
```

## 🔧 Comandos Principales

| Comando | Acción |
|---------|--------|
| "Ingresar alumno nuevo" | Abre form de nuevo alumno |
| "Generar recibo para [nombre]" | Crea y envía recibo |
| "Completar obra social [nombre]" | Auto-completa formulario |
| "Crear planilla de asistencia" | Genera planilla del mes |
| "Ver estado de [nombre]" | Consulta info del alumno |
| "Ayuda" | Muestra todos los comandos |

## 🌐 Integraciones

### Automáticas:
- **Google Drive**: Sincroniza documentos automáticamente
- **Gmail**: Envía recibos y notificaciones
- **Slack**: Alertas personales (#club-juntos-tareas-hoy)
- **Notion**: Sincroniza base de datos

### Configurables:
- WhatsApp (para envío de recibos)
- Otros servicios vía Zapier

## 📚 Documentación Completa

- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Diseño técnico detallado
- [**SETUP.md**](./docs/SETUP.md) - Guía paso a paso
- [**API.md**](./docs/API.md) - Referencia de endpoints

## 🤝 Contribuir

¿Encontraste un bug o tenés una idea? ¡Abrí un issue!

```bash
# Para agregar features:
git checkout -b feature/tu-feature
git commit -m "feat: descripción"
git push origin feature/tu-feature
```

## 📄 Licencia

MIT © Club Juntos

---

**Hecho con 💜 para simplificar la vida de Club Juntos**

¿Preguntas? ¡Escribile a Yarbis directamente en la app! 🤖
