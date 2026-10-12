# Fichaje y dashboard con Google Apps Script

Versión gratuita del control de asistencia de profesores. Usa una planilla de Google como base de datos y Apps Script para la lógica y el dashboard.

## Estado

| Parte | Estado |
|---|---|
| Lógica de horarios, tardanzas, métricas y tablero | Hecha y probada con Node (`test/logic.test.js`) |
| Dashboard solo para la cuenta dueña | Hecho. No probado en Google todavía |
| Fichaje por Google Forms | Implementado (`onFormSubmit`). No probado en Google todavía |
| Fichaje desde la web app (`Fichaje.html`) | **No usar.** Con "Ejecutar como: yo", Apps Script no devuelve el correo de cuentas personales de Gmail |

## Archivos

- `Code.gs`: lógica y acceso a la planilla.
- `Dashboard.html`: tablero de métricas (solo la cuenta dueña).
- `Fichaje.html`: página de fichaje. Por ahora no es usable para las profesoras, ver arriba.
- `test/logic.test.js`: pruebas de la lógica pura. Se corren con `node --test apps/fichaje-appscript/test/logic.test.js`.

## Planilla

Creá una planilla con tres hojas y estos encabezados (en la primera fila, exactamente así):

**Profesores**: `legajo | nombre | apellido | rol | email | activo | desde`
- `activo`: `si` o `no`.
- `desde`: fecha de alta (AAAA-MM-DD). Las métricas no cuentan días anteriores.

**Horarios**: `legajo | dia | inicio | fin`
- `dia`: 1 = lunes ... 7 = domingo. Una fila por día de trabajo.
- `inicio` y `fin`: hora en formato HH:mm.

**Fichajes**: `fecha | hora | legajo | email | evento | estado`
- La hoja la completa el sistema. No la edites a mano.

En la configuración de la planilla (Archivo > Configuración), poné la zona horaria **Argentina (GMT-3)**. Si no, las horas se leen mal.

## Despliegue del dashboard

1. En la planilla: Extensiones > Apps Script. Pegá `Code.gs` y creá los archivos HTML `Dashboard` y `Fichaje` con el contenido de cada archivo.
2. Configuración del proyecto > Propiedades del script. Agregá:
   - `ADMIN_EMAIL`: tu correo de Google (el único que ve el dashboard).
   - `TOLERANCIA_MINUTOS`: opcional, por defecto 10.
3. Implementar > Nueva implementación > Aplicación web:
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona con cuenta de Google**.
4. Abrí la URL de la web app con `?vista=dashboard`. Si no sos la cuenta dueña, la página dice "No autorizado".

## Fichaje por Google Forms

Cada profesora ficha con un formulario, identificada por su cuenta de Google.

1. Creá un Google Form con **una sola pregunta de opción múltiple llamada exactamente `Acción`**, con estas opciones:
   - `Entrada`
   - `Salida`
   - `No vengo (falta justificada)`
2. En la configuración del formulario, activá **Recopilar direcciones de correo electrónico** y, si tu cuenta lo permite, **Requerir inicio de sesión** para que el correo sea verificado.
3. Vinculá el formulario con la planilla (Respuestas > Crear hoja de cálculo) y usá esa misma planilla.
4. En Apps Script: Activadores > Agregar activador:
   - Función: `onFormSubmit`
   - Evento: **Desde la planilla** > **Al enviar el formulario**.
5. Verificá que el correo de cada profesora en la hoja Profesores sea **exactamente** el de su cuenta de Google, en minúsculas.

Cada respuesta se procesa con la misma regla de tardanzas probada en `test/logic.test.js`. Si el correo no está en Profesores, o la opción no es reconocida, no se registra nada y el motivo queda en Ejecuciones (Apps Script > Ejecuciones). Hoy el formulario no le confirma nada a la profesora, así que conviene revisar ese registro los primeros días.
