"""Yarbis Bot - Asistente funcional para Club Juntos."""

import json
from personality import YarbisPersonality
from handlers import YarbisBot

# Inicializar Yarbis
yarbis_personality = YarbisPersonality()
yarbis_bot = YarbisBot()


def chat(user_input: str) -> str:
    """
    Procesa comando del usuario y ejecuta acción.

    Args:
        user_input: Comando natural del usuario

    Returns:
        Respuesta JSON con resultado y acciones
    """
    try:
        # Procesar comando
        result = yarbis_bot.process_command(user_input)

        # Agregar personalidad
        if "message" in result and not result["message"].startswith("🤖"):
            if result.get("success", True):
                # Agregar personalidad positiva
                pass
            elif not result.get("success", True):
                # Respuesta de error con personalidad
                pass

        return json.dumps(result, ensure_ascii=False, indent=2)

    except Exception as e:
        return json.dumps(
            {
                "success": False,
                "message": f"{yarbis_personality.get_error_message()} Error: {str(e)}",
                "error": str(e),
            },
            ensure_ascii=False,
        )


def add_student(
    first_name: str,
    last_name: str,
    dni: str,
    email: str,
    phone: str,
    date_of_birth: str,
) -> str:
    """Ingresa un alumno nuevo."""
    result = yarbis_bot.handle_student_data(
        first_name, last_name, dni, email, phone, date_of_birth
    )

    # Sincronizar a Google Drive
    yarbis_bot.sync_to_drive("alumnos", result)

    # Notificar a Slack
    yarbis_bot.send_slack_notification(
        f"✅ Nuevo alumno: {first_name} {last_name}"
    )

    return json.dumps(result, ensure_ascii=False, indent=2)


def get_student_status(name_or_id: str) -> str:
    """Obtiene estado de un alumno."""
    result = yarbis_bot.student_handler.get_student_status(name_or_id)
    return json.dumps(result, ensure_ascii=False, indent=2)


def generate_receipt(student_name: str, amount: float) -> str:
    """Genera recibo."""
    result = yarbis_bot.handle_receipt_data(student_name, amount)

    if result.get("success"):
        # Enviar por email
        yarbis_bot.receipt_handler.send_receipt_email(result.get("receiptId"))

        # Sincronizar a Drive
        yarbis_bot.sync_to_drive("recibos", result)

        # Notificar a Slack
        yarbis_bot.send_slack_notification(
            f"💰 Recibo generado para {student_name}: ${amount}"
        )

    return json.dumps(result, ensure_ascii=False, indent=2)


def list_students() -> str:
    """Lista todos los alumnos."""
    result = yarbis_bot.student_handler.list_students()
    return json.dumps(result, ensure_ascii=False, indent=2)


def get_pending_receipts() -> str:
    """Obtiene recibos pendientes."""
    result = yarbis_bot.receipt_handler.get_pending_receipts()
    return json.dumps(result, ensure_ascii=False, indent=2)


def mark_attendance(student_name: str, status: str = "present") -> str:
    """Marca asistencia."""
    result = yarbis_bot.attendance_handler.mark_attendance(student_name, status)
    return json.dumps(result, ensure_ascii=False, indent=2)


def complete_insurance_form(student_name: str, insurance_company: str) -> str:
    """Completa formulario de obra social."""
    result = yarbis_bot.insurance_handler.complete_insurance_form(
        student_name, insurance_company
    )

    if result.get("success"):
        # Sincronizar a Drive
        yarbis_bot.sync_to_drive("obras_sociales", result)

        # Notificar a Slack
        yarbis_bot.send_slack_notification(
            f"📋 Obra social {insurance_company} completada para {student_name}"
        )

    return json.dumps(result, ensure_ascii=False, indent=2)


def get_help() -> str:
    """Retorna menú de ayuda."""
    return json.dumps(
        {
            "message": """
🤖 **Yarbis - Tu asistente de Club Juntos**

**📝 Gestión de Alumnos:**
- "Ingresar alumno nuevo"
- "Estado de [nombre]"
- "Todos los alumnos"

**💰 Recibos:**
- "Generar recibo para [nombre]"
- "Recibos pendientes"

**📋 Obras Sociales:**
- "Obra social para [nombre]"

**📊 Asistencia:**
- "Planilla del mes"
- "Marcar presente a [nombre]"

**🔧 Utilidades:**
- "Ayuda" - Este menú
- "Qué podes hacer"

¿Qué necesitás?
"""
        },
        ensure_ascii=False,
    )


if __name__ == "__main__":
    # Pruebas
    print("🤖 Yarbis Bot Iniciado\n")

    # Test: Chat
    result = chat("Qué puedo hacer?")
    print(result)

    # Test: Ingresar alumno
    print("\n" + "="*50)
    print("Ingresando alumno...")
    result = add_student("Juan", "García", "45123456", "juan@example.com", "1123456789", "15/05/2010")
    print(result)
