# Ejemplos de Uso - Yarbis Chatbot

Aquí están todos los comandos y ejemplos para interactuar con Yarbis.

## 📝 Ingresar Alumno Nuevo

### Comando Inicial
Escribe cualquiera de estos:
- "Ingresar alumno nuevo"
- "Ingresar un alumno"
- "Nuevo alumno"

### Respuesta de Yarbis
```
¡Dale! Vamos a ingresar un alumno nuevo 🎓
Decime: nombre completo, DNI, email, teléfono y fecha de nacimiento
(ej: Juan García, 45123456, juan@gmail.com, 1123456789, 15/05/2010)
```

### Proporciona los Datos
Escribe el nombre, DNI y contacto separados por comas:
```
Juan García, 45123456, juan@gmail.com, 1123456789, 15/05/2010
```

### Resultado
- ✅ Alumno creado en la base de datos (ID: STU-0001)
- 📁 Carpeta creada en Google Drive (`Legajos/45123456/`)
- ✉️ Email de bienvenida enviado a juan@gmail.com
- 📊 Datos guardados en planilla de Google Sheets

## 🔍 Consultar Estado de Alumno

### Comando
Escribe:
- "Estado de Juan García"
- "Qué onda Juan"
- "Info de María López"

### Respuesta
```
📋 **Estado de Juan García**

- ID: STU-0001
- DNI: 45123456
- Email: juan@gmail.com
- Teléfono: 1123456789
- Fecha Ingreso: 10/08/2026
- Estado: ACTIVE
- Deuda Total: $500
```

## 👥 Listar Todos los Alumnos

### Comando
Escribe:
- "Todos los alumnos"
- "Listar alumnos"
- "¿Cuántos alumnos hay?"

### Respuesta
```
📊 **Total de Alumnos: 3 (3 activos)**

- Juan García (45123456) - ACTIVE
- María López (46789012) - ACTIVE
- Carlos Fernández (43456789) - ACTIVE
```

## 💰 Generar Recibos

### Comando
Escribe:
- "Recibo para Juan García de $500"
- "Generar recibo Juan de $300"
- "Recibo de $150 para María López"

### Respuesta
```
¡Boom! ✅ Recibo generado

💳 **REC-000001**
- Alumno: Juan García
- Monto: $500
- Fecha: 10/08/2026
- Email enviado ✉️
- Guardado en Drive 💾
```

**Acciones Automáticas:**
- 📨 Email enviado a juan@gmail.com con el recibo
- 📁 PDF guardado en carpeta del estudiante en Google Drive
- 📊 Registro guardado en Sheets de Recibos

### Ver Recibos Pendientes

Escribe:
- "Recibos pendientes"
- "Deudores"
- "Cuánto se debe"

Respuesta:
```
📋 **Recibos Pendientes: 2**

Deuda Total: $800

- REC-000001: $500
- REC-000002: $300
```

## 📊 Ver Estadísticas

### Comando
Escribe:
- "Reportes"
- "Estadísticas"
- "Mostrar datos"

### Respuesta
```
📊 **Estadísticas de Club Juntos**

👥 Alumnos: 3 (3 activos)
💰 Recibos: 5
📋 Deuda: $800
✅ Cobrado: $2500
📈 Asistencias: 12
```

## 🎯 Comandos de Ayuda

### Comando
Escribe:
- "Ayuda"
- "Help"
- "¿Qué puedo hacer?"

### Respuesta
```
🤖 **Yarbis - Tu Asistente de Club Juntos**

**Comandos:**
📝 "Ingresar alumno nuevo" - Nuevo alumno
🔍 "Estado de [nombre]" - Info del alumno
"Todos los alumnos" - Listar activos
💰 "Recibo para [nombre] de $[monto]" - Generar
"Recibos pendientes" - Deudores
📊 "Reportes" - Estadísticas

¿Qué necesitás?
```

## 🎤 Usar Entrada de Voz

### Paso a Paso

1. **Haz clic en el botón 🎤** debajo del campo de texto
2. **Veras 🔴 Grabando** - el micrófono está activo
3. **Habla claramente** - ej: "Ingresar alumno nuevo"
4. **Detente de grabar** - haz clic en 🔴 Grabando para parar
5. **Espera transcripción** - Deepgram convierte tu voz a texto
6. **Yarbis responde** - igual que con texto escrito

### Consejos para Mejor Transcripción

✅ Habla claro y en volumen normal  
✅ Evita ruido de fondo  
✅ Usa pausas entre frases  
✅ Repite si la transcripción no es exacta  
✅ Funciona mejor en español argentino  

### Ejemplos de Voz

```
"Ingresar alumno nuevo"
↓
Yarbis transcribe y responde con el formulario

"Juan García, cuarenta y cinco millones ciento veintitrés mil cuatrocientos cincuenta y seis..."
↓
Yarbis entiende los números y crea el estudiante
```

## 🚀 Flujos Avanzados

### Crear Múltiples Alumnos en Secuencia

```
Usuario: "Ingresar alumno nuevo"
Yarbis: [pide datos]

Usuario: "Juan García, 45123456, juan@gmail.com, 1123456789, 15/05/2010"
Yarbis: ✅ Juan ingresado

Usuario: "Ingresar otro"
Yarbis: [pide datos nuevamente]

Usuario: "María López, 46789012, maria@gmail.com, 1198765432, 20/03/2009"
Yarbis: ✅ María ingresada
```

### Generador de Reportes Mensual

```
Usuario: "Reportes"
Yarbis: [muestra estadísticas]

Usuario: "Exportar a Sheets"
Yarbis: 📊 Datos exportados a "Reportes Agosto 2026"
```

### Seguimiento de Pagos

```
Usuario: "Recibos pendientes"
Yarbis: [lista deudores]

Usuario: "Marcar REC-000001 como pagado"
Yarbis: ✅ Recibo marcado como pagado
        💰 Deuda total: $300
```

## ⚙️ Integración con Google Workspace

Cuando ejecutas acciones, Yarbis automáticamente:

### Google Drive
- 📁 Crea carpetas por DNI del alumno: `Legajos/45123456/`
- 📄 Guarda documentos: recibos, formularios, reportes
- 🔐 Organiza en carpetas por tipo de documento

### Gmail
- ✉️ Envía emails de bienvenida a nuevos alumnos
- 📋 Envía copias de recibos
- 🔔 Notificaciones de pagos recibidos

### Google Sheets
- 📊 Crear hojas de control de alumnos
- 💰 Registro automático de recibos
- 📈 Planillas de asistencia
- 📋 Reportes de deudores

## 🎨 Personalización

### Cambiar Respuestas de Yarbis

Edita `src/app/api/voice/route.ts` línea 38-53 para cambiar la personalidad de Yarbis.

Ejemplo:
```typescript
const systemPrompt = `Eres Yarbis, un asistente AI...
// Aquí puedes agregar más detalles sobre el tono y comportamiento
`;
```

### Agregar Nuevos Comandos

Edita `src/components/ChatWindow.tsx` la función `processCommand()` (línea 39) para agregar:

```typescript
// Nuevo comando: Marcar asistencia
if (textLower.includes('asistencia')) {
  // Tu lógica aquí
  return {
    message: 'Respuesta personalizada',
    action: 'custom_action',
  };
}
```

## 💡 Tips Útiles

### Para Obtener Mejor Experiencia

1. **Guardar URLs de Google Drive** - Abre las carpetas creadas para acceso rápido
2. **Usar Slack** - Configura notificaciones de nuevos alumnos en Slack
3. **Planillas Compartidas** - Comparte las Sheets de Google con el equipo
4. **Backups** - Google Drive automáticamente hace backup de todo
5. **Historial** - Abre el panel de conversación para ver todo el historial

### Atajos

- **Ctrl+Enter** - Envía mensaje rápidamente
- **🎤 + Hablar rápido** - Ideal para operaciones rápidas
- **Escribir comandos similares** - Yarbis entiende variaciones

¡Listo! Ya dominas todo lo que Yarbis puede hacer. ¿Necesitás algo más? 🚀
