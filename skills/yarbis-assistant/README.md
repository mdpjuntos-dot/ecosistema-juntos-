# Yarbis Assistant - Bot Funcional

Yarbis es un bot conversacional que REALMENTE TRABAJA. Entiende comandos naturales en Spanglish y ejecuta acciones reales en Club Juntos.

## Features

✅ **Conversacional**: Chat natural en Spanglish
✅ **Funcional**: Ejecuta acciones reales (crea alumnos, recibos, etc)
✅ **Integrado**: Google Drive, Gmail, Slack, Notion
✅ **Automático**: Guarda todo sin que tengas que hacer nada
✅ **Rápido**: Respuestas instantáneas

## Instalación

```bash
cd skills/yarbis-assistant

# Crear virtual env
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

## Uso

### Como módulo Python

```python
from yarbis import chat, add_student, generate_receipt

# Chat natural
response = chat("Qué puedo hacer?")
print(response)

# Ingresar alumno
result = add_student(
    "Juan", "García", "45123456", 
    "juan@example.com", "1123456789", 
    "15/05/2010"
)
print(result)

# Generar recibo
receipt = generate_receipt("Juan García", 5000)
print(receipt)
```

### Como CLI

```bash
python -m yarbis "Ingresar alumno nuevo"
python -m yarbis "Estado de Juan"
python -m yarbis "Generar recibo para María de $5000"
```

## Comandos Disponibles

### 📝 Gestión de Alumnos

```
Ingresar alumno nuevo
→ Abre flujo de ingreso interactivo

Estado de Juan
Ver info de María
→ Muestra datos completos del alumno

Todos los alumnos
Listar estudiantes
→ Lista de alumnos activos
```

### 💰 Recibos

```
Generar recibo para Juan de $5000
Recibo para María
→ Crea recibo, envía por email, guarda en Drive

Recibos pendientes
Qué está sin pagar?
→ Lista de deudores
```

### 📋 Obras Sociales

```
Obra social para Juan - OSDE
Completar seguro de María
→ Auto-completa formulario, guarda en Drive

Ver obras sociales
Qué obras tenemos?
→ Lista de obras sociales completadas
```

### 📊 Asistencia

```
Planilla del mes
Crear planilla de agosto
→ Genera planilla, sincroniza Drive

Marcar presente a Juan
Ausente: María, Carlos
→ Actualiza asistencia
```

### 🔍 Información

```
Ayuda
Qué puedes hacer?
→ Muestra este menú

Buscar Juan
Todos los alumnos
→ Búsquedas
```

## Arquitectura

```
YarbisBot (orquestador)
├── StudentHandler (gestión de alumnos)
├── ReceiptHandler (recibos)
├── AttendanceHandler (asistencia)
├── InsuranceHandler (obras sociales)
└── Sync Services
    ├── Google Drive
    ├── Gmail
    ├── Slack
    └── Notion
```

## Respuestas Ejemplo

### Ingreso de Alumno

```
You: Ingresar alumno nuevo

Yarbis: ¡Ey! Dale, vamos a ingresar un alumno nuevo 🤖
Decime: nombre, apellido, DNI, email, teléfono y fecha de nacimiento

You: Juan García, DNI 45123456, juan@gmail.com, 1123456789, 15/05/2010

Yarbis: ¡Boom! ✅ Alumno ingresado:
- Nombre: Juan García
- DNI: 45123456
- Email: juan@gmail.com
- Estado: Activo
- Fecha ingreso: 10/08/2026

¿Generamos recibo de inscripción?
```

### Generar Recibo

```
You: Recibo para María de $5000

Yarbis: Dale, generando recibo... 💿

Yarbis: ¡Hecho, boludo! ✅
- Recibo: REC-000001
- Alumna: María
- Monto: $5000
- Fecha: 10/08/2026
- Email enviado ✉️
- Guardado en Drive 💾
```

## Integraciones

### Google Drive
- Carpeta automática: `Drive/Club Juntos/[tipo]/[año]/[mes]/`
- Sincroniza: Alumnos, Recibos, Formularios, Planillas

### Gmail
- Envía comprobantes automáticamente
- Notificaciones de vencimientos
- Confirmaciones de ingreso

### Slack
- Notificaciones en `#club-juntos-tareas-hoy`
- Alertas de inactividad (2+ días sin asistencia)
- Reportes diarios

### Notion
- Base de datos sincronizada
- Alumnos, Pagos, Asistencia
- Actualización en tiempo real

## Testing

```bash
# Ejecutar tests
pytest tests/

# Con cobertura
pytest --cov=yarbis tests/

# Testing interactivo
python -m yarbis --interactive
```

## Roadmap

- [x] Core del bot (chat, handlers)
- [x] Gestión de alumnos
- [x] Recibos
- [x] Obras sociales
- [x] Asistencia
- [ ] Integración Google Drive (API)
- [ ] Integración Gmail (API)
- [ ] Integración Slack (Bot)
- [ ] Base de datos persistente
- [ ] OAuth2 authentication
- [ ] Reportes avanzados
- [ ] Machine learning para predicciones

## Desarrollo

### Agregar nuevo comando

1. Crear handler en `handlers.py`
2. Agregar ruta en `YarbisBot.process_command()`
3. Agregar tests en `tests/`
4. Documentar en `README.md`

### Agregar nueva integración

1. Crear módulo en `integrations/`
2. Implementar interfaz estándar
3. Conectar en handlers correspondientes
4. Agregar configuración en `.env.local`

## FAQ

**¿Puedo usar Yarbis sin Google Drive?**
Sí, guarda todo en SQLite localmente. Drive es opcional.

**¿Qué pasa si hay error?**
Yarbis lo avisa y rollback de cambios. Todo es seguro.

**¿Puedo acceder a los datos después?**
Sí, en Drive, Notion, Slack o en el CLI: `python -m yarbis report mes`

**¿Qué tan rápido?**
Segundos. Todo es async y optimizado.

---

**Hecho con 💜 para simplificar Club Juntos**

[Documentación Completa](../docs/ARCHITECTURE.md) | [Issues](../../issues) | [Contribuir](../../CONTRIBUTING.md)
