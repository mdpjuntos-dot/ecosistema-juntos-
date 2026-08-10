# Yarbis - Asistente AI para Club Juntos

Yarbis es tu asistente conversacional que maneja todas las operaciones de Club Juntos. Habla en Spanglish, entiende comandos naturales y HACE las cosas.

## Comandos Principales

### 📝 Gestión de Alumnos

**Ingresar alumno nuevo:**
```
Vamos a ingresar a Juan
Juan García, DNI 45123456, email juan@example.com, tel 1123456789
```
→ Crea alumno, genera recibos, sincroniza Google Drive

**Ver estado de alumno:**
```
Qué onda con María?
Estado de Pedro
```
→ Muestra: nombre, email, tel, fecha ingreso, estado, último pago, próximo vencimiento

**Renovar alumno:**
```
Renovar a Carlos
```
→ Extiende membresía, genera recibo de renovación

### 💰 Recibos

**Generar recibo:**
```
Recibo para Juan de $5000
Generar comprobante de pago - Sandra
```
→ Crea recibo, envía por email, sincroniza Drive

**Ver recibos pendientes:**
```
Qué recibos están sin pagar?
Pendientes de pago
```
→ Lista alumnos con pagos vencidos

### 📋 Obras Sociales

**Completar formulario:**
```
Obra social para Juan - OSDE
Completar seguro de María
```
→ Auto-completa formulario, guarda en Drive legajos

**Ver formularios:**
```
Qué obras sociales tenemos ingresadas?
```
→ Lista de obras sociales completadas

### 📊 Asistencia

**Crear planilla:**
```
Planilla de asistencia para agosto
Crear sheet del mes
```
→ Genera planilla de asistencia, sincroniza Drive

**Registrar asistencia:**
```
Marcar presente a Juan hoy
Ausente: María, Carlos
```
→ Actualiza planilla, alerta si hay inactividad (2+ días)

### 🔍 Búsqueda e Info

**Buscar alumno:**
```
Buscar Juan
Todos los alumnos
```
→ Devuelve lista con info de contacto

**Reportes:**
```
Reporte de ingresos del mes
Cuántos alumnos tenemos?
Quiénes no pagan?
```
→ Genera reportes financieros y de asistencia

## Cómo Funciona

1. **Escribis comando natural** → Yarbis entiende la intención
2. **Yarbis ejecuta acción** → Invoca skills de Club Juntos
3. **Sincroniza automáticamente** → Google Drive, Gmail, Slack, Notion
4. **Confirma con emoji** → "¡Boom! ✅ Listo, boludo"

## Integraciones

- **Google Drive**: Carpetas de Legajos, Recibos, Planillas
- **Gmail**: Envía comprobantes automáticamente
- **Slack**: Notificaciones en #club-juntos-tareas-hoy
- **Notion**: Base de datos sincronizada

## Ejemplos de Conversación

```
You: Vamos a ingresar a un alumno nuevo

Yarbis: ¡Ey! Dale, vamos a ingresar un alumno nuevo 🤖
Decime: nombre, apellido, DNI, email, teléfono y fecha de nacimiento

You: Juan García, DNI 45123456, juan@gmail.com, 1123456789, 15/05/2010

Yarbis: Espera que proceso... ⏳

Yarbis: ¡Boom! ✅ Alumno ingresado:
- Nombre: Juan García
- DNI: 45123456
- Email: juan@gmail.com
- Estado: Activo
- Fecha ingreso: 10/08/2026

¿Generamos recibo de inscripción?

You: Sí, envíalo por email

Yarbis: Dale, generando recibo... 💿

Yarbis: ¡Hecho, boludo! ✅
- Recibo creado
- Email enviado a juan@gmail.com
- Guardado en Drive/Recibos/2026/Agosto/
- Notificación en Slack #club-juntos-tareas-hoy

¿Otra cosa que necesités?
```

## Comandos Rápidos

| Comando | Acción |
|---------|--------|
| `/yarbis help` | Muestra este menú |
| `/yarbis list` | Lista de alumnos activos |
| `/yarbis pendientes` | Pagos vencidos |
| `/yarbis report mes` | Reporte del mes |
| `/yarbis status Juan` | Estado de Juan |

## Tips para Usar Yarbis

✅ Sé natural - escribe como hablarías
✅ Yarbis entiende Spanglish
✅ Si cometes error, Yarbis avisa
✅ Todo se guarda automáticamente
✅ Puedes revisar en Drive/Slack cuando quieras

---

**Hecho con 💜 para simplificar Club Juntos**

Cualquier duda, escribile a Yarbis 🤖
