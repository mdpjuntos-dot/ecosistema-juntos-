# Arquitectura de Yarbis

## Visión General

Yarbis es una arquitectura de **3 capas**:

```
┌─────────────────────────────────────────────────────────┐
│         Web App (React/Next.js)                         │
│         - Chat UI                                       │
│         - Forms (Student, Receipt, Insurance, etc)    │
│         - Real-time state management                    │
└─────────────┬───────────────────────────────────────────┘
              │
              │ HTTP
              ▼
┌─────────────────────────────────────────────────────────┐
│    API Routes (Next.js)                                 │
│    - /api/chat → Claude SDK                            │
│    - /api/skills → Invocar skills                      │
│    - /api/users → Data management                       │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Tool Use
              ▼
┌─────────────────────────────────────────────────────────┐
│    Yarbis Skill (FastMCP + Python)                      │
│    - Orchestrator (detecta intents)                     │
│    - Personality (Spanglish)                            │
│    - Handlers (ingreso, recibos, etc)                   │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Invokes
              ▼
┌─────────────────────────────────────────────────────────┐
│    Club Juntos Skills                                    │
│    - club-juntos-ingreso-alumnos                        │
│    - club-juntos-generador-recibos                      │
│    - completador-obras-sociales-generico                │
│    - creador-de-planillas                               │
└─────────────┬───────────────────────────────────────────┘
              │
              │ CRUD Operations
              ▼
┌─────────────────────────────────────────────────────────┐
│    External Services                                    │
│    - Google Drive                                       │
│    - Gmail                                              │
│    - Slack                                              │
│    - Notion                                             │
└─────────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. **Web App (Frontend)**

**Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS

**Estructura**:
```
apps/yarbis-web/src/
├── app/
│   ├── page.tsx              # Landing page con ChatWindow
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       └── chat/
│           └── route.ts      # POST /api/chat endpoint
├── components/
│   ├── ChatWindow.tsx        # Main chat container
│   ├── ChatMessage.tsx       # Individual message
│   ├── InputField.tsx        # Message input
│   ├── CommandPalette.tsx    # Command quick-access
│   ├── StudentIntakeForm.tsx # Student form component
│   ├── ReceiptPreview.tsx    # Receipt display
│   └── [otros forms...]
└── lib/
    ├── types.ts              # TypeScript interfaces
    ├── utils.ts              # Utility functions
    └── api-client.ts         # HTTP client for API calls
```

**Características**:
- Chat UI responsive en tiempo real
- Forms contextuales (aparecen según la intención)
- Integración con Claude para streaming responses
- State management con Zustand (opcional)
- Dark mode + Light mode

### 2. **API Routes (Backend)**

**Stack**: Next.js API Routes, Node.js, Claude SDK

**Endpoints**:

#### `POST /api/chat`
Procesa mensajes de chat y delega a Claude.

```typescript
Request:
{
  messages: Array<{role: 'user'|'assistant', content: string}>,
  userMessage: string
}

Response:
{
  message: string,
  action?: string,  // 'open_form', 'generate_receipt', etc
  formType?: string,
  usage: {input_tokens, output_tokens}
}
```

**Lógica**:
1. Recibe mensaje del user
2. Envía a Claude con system prompt de Yarbis
3. Claude detecta la intención
4. Retorna mensaje + acción asociada
5. Frontend interpreta acción y muestra componente correspondiente

### 3. **Yarbis Skill (MCP Server)**

**Stack**: Python 3.10+, FastMCP, Pydantic

**Módulos**:

#### `personality.py`
Define la personalidad y frases de Yarbis.

```python
class YarbisPersonality:
    - get_greeting()         # "¡Ey! Yo soy Yarbis..."
    - get_affirmation()      # "Dale, vamo' a hacerlo"
    - get_error_message()    # "Uh, metí la pata"
    - wrap_response()        # Añade estilo a respuestas
    - spanglify()            # Convierte texto a Spanglish
```

#### `orchestrator.py`
Orquesta la lógica de routing y manejo de intents.

```python
class SkillOrchestrator:
    - detect_intent()        # 'new_student', 'receipt', etc
    - handle_new_student()   # Flujo de ingreso
    - handle_receipt_generation()
    - handle_insurance_form()
    - handle_attendance_sheet()
    - invoke_skill()         # Invoca skills de Club Juntos
    - get_student_status()   # Consulta estado del alumno
```

#### `main.py`
Servidor MCP expone herramientas como endpoints.

**Tools disponibles**:
```python
@app.call_tool()
async def chat(message: str) -> dict
    # Endpoint principal - acepta mensaje, retorna respuesta

@app.call_tool()
async def invoke_skill(skill_name: str, params: dict) -> dict
    # Invoca skill específica de Club Juntos

@app.call_tool()
async def list_available_skills() -> list
    # Lista skills disponibles

@app.call_tool()
async def get_student_status(student_id: str) -> dict
    # Obtiene estado del alumno
```

## Flujo de Datos: Caso de Uso "Ingresar Alumno"

```
1. Usuario escribe: "Ingresar alumno nuevo"
   │
   ├─→ ChatWindow.tsx (Front)
   │   └─→ onSend() llamada
   │
   ├─→ /api/chat (Next.js Route)
   │   └─→ POST con { messages: [...], userMessage: "..." }
   │
   ├─→ Claude SDK (con system prompt Yarbis)
   │   └─→ Claude detecta intent: "new_student"
   │       Retorna: "Dale, vamos a ingresar un alumno nuevo"
   │
   ├─→ Response retorna a frontend
   │   └─→ { message: "...", action: "open_form", formType: "student_intake" }
   │
   ├─→ ChatWindow renderiza:
   │   ├─→ ChatMessage con respuesta de Yarbis
   │   └─→ StudentIntakeForm (aparece automáticamente)
   │
   2. Usuario completa formulario: [Nombre, Email, DNI, etc]
   │
   ├─→ StudentIntakeForm.onSubmit()
   │   └─→ POST /api/skills con { skill: 'ingreso-alumnos', params: {...} }
   │
   ├─→ Yarbis Skill orchestrator.invoke_skill('ingreso-alumnos', {...})
   │   └─→ Invoca club-juntos-ingreso-alumnos skill
   │       └─→ Crea registro en DB + Google Drive
   │           └─→ Retorna: { success: true, studentId: '123', ... }
   │
   ├─→ Response retorna al frontend
   │
   ├─→ ChatWindow actualiza:
   │   ├─→ Nueva mensaje de Yarbis: "¡Boom! Listo ✅ Alumno ingresado"
   │   └─→ Opción para siguiente paso: "¿Generamos recibo?"
   │
3. Flujo continúa con nuevas acciones...
```

## Detección de Intents

La detección ocurre en dos niveles:

### Nivel 1: Frontend (ChatWindow.tsx)
```typescript
// Palabras clave que disparan componentes locales
const intentKeywords = {
  'nuevo': StudentIntakeForm,
  'recibo': ReceiptPreview,
  'obra social': InsuranceForm,
  'asistencia': AttendanceSheet,
}
```

### Nivel 2: Backend (Claude + Yarbis)
Claude analiza el mensaje completo y detecta:
- Intención principal
- Entidades (nombres, montos, etc)
- Contexto (si es continuación de una conversación)
- Acción a tomar (open_form, generate_receipt, etc)

```python
# En orchestrator.py
class Intent(Enum):
    NEW_STUDENT = "new_student"
    GENERATE_RECEIPT = "generate_receipt"
    INSURANCE_FORM = "insurance_form"
    ATTENDANCE_SHEET = "attendance_sheet"
    STUDENT_STATUS = "student_status"
    HELP = "help"
    UNKNOWN = "unknown"
```

## Integraciones Externas

### Google Drive
```python
# Automático al crear documento
- Nuevos alumnos → Carpeta "Alumnos/[DNI]/"
- Recibos → Carpeta "Recibos/[Año]/[Mes]/"
- Formularios → Carpeta "Legajos/[DNI]/"
```

### Gmail
```python
# Auto-send cuando se generan documentos
- Recibos → Email al alumno
- Recordatorios → Alertas de vencimiento
- Confirmaciones → Ingreso/renovación completados
```

### Slack
```python
# Notificaciones en Slack personal
- #club-juntos-tareas-hoy → Recordatorios diarios
- @yarbis → Puedes pedir reportes
- Alertas → Inactividad (2+ días sin asistencia)
```

### Notion (Sincronización)
```python
# Base de Notion se actualiza automáticamente
- Alumnos: inserción/actualización
- Pagos: registro de transacciones
- Asistencia: planillas del mes
```

## Seguridad y Validación

### Niveles de Validación

1. **Frontend**: Validación de inputs en formularios
2. **API Routes**: Validación de payload + autenticación
3. **Yarbis Skill**: Validación de tipos + permisos
4. **Club Juntos Skills**: Lógica especializada

### Autenticación (Futuro)
```python
# Próximos pasos:
- OAuth2 con Google (para acceso a Drive/Gmail)
- JWT tokens en API routes
- Rate limiting en endpoints públicos
- Logging de acciones sensibles
```

## Deployment

### Opciones

**Opción 1: Vercel + Railway**
```bash
# Web App en Vercel (serverless)
# Yarbis Skill en Railway (container)
```

**Opción 2: Docker Compose**
```yaml
# docker-compose.yml
services:
  web:
    image: next-app
    ports: 3000
  skill:
    image: yarbis-skill
    ports: 8000
```

**Opción 3: Cloud Run**
```bash
# Ambos services en Google Cloud Run
```

## Escalabilidad

### Caching
- Redis para historial de chats
- Session storage en DB

### Rate Limiting
- 100 requests/min por usuario
- 10 skill invocations/min

### Database
- SQLite para desarrollo
- PostgreSQL para producción
- Supabase para rápido setup

## Monitoreo y Logging

```python
# Logs importantes:
- Mensajes de chat (sanitizados)
- Errores en skill invocation
- Intents detectados
- Tiempo de respuesta

# Métricas:
- Errores 4xx/5xx
- Latencia promedio
- Skills más usados
```

---

**Última actualización**: Agosto 2026
