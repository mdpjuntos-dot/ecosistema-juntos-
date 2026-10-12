# Fichaje y dashboard con Google Apps Script

Versión gratuita del control de asistencia de profesores. Usa una planilla de Google como base de datos y Apps Script para la lógica y el dashboard.

## Estado

| Parte | Estado |
|---|---|
| Lógica de horarios, tardanzas, métricas y tablero | Hecha y probada con Node (`test/logic.test.js`) |
| Dashboard solo para la cuenta dueña | Hecho. No probado en Google todavía |
| Fichaje desde la web app | **Pendiente.** Con "Ejecutar como: yo", Apps Script no devuelve el correo de las profesoras con cuentas personales de Gmail, así que no pueden identificarse |
| Fichaje por Google Forms | Propuesto. Ver la sección "Fichaje" |

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

## Fichaje (propuesta, pendiente de confirmar)

Para que cada profesora quede identificada con su cuenta de Google:

- Un Google Form con las opciones **Entrada**, **Salida** y **No vengo (falta justificada)**, y la opción de pedir inicio de sesión con Google para registrar el correo.
- Un disparador `onFormSubmit` que toma el correo de la respuesta, busca al profesor en la hoja Profesores y escribe el evento en Fichajes con la misma lógica de tardanzas que ya está probada.
- Confirmar en la configuración del formulario que el correo se registra con verificación de inicio de sesión. Las opciones cambian según el tipo de cuenta.

Esto requiere que cada profesora tenga cuenta de Google. Si alguna no tiene, se puede registrar el fichaje a mano desde el formulario de coordinación.
