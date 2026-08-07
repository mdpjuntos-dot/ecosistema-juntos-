"""Yarbis Assistant - MCP Server for Club Juntos integration."""

from fastmcp import Server
from fastmcp.server import Request, RequestContext
import json
from personality import YarbisPersonality
from orchestrator import SkillOrchestrator

# Initialize Yarbis
app = Server("yarbis-assistant")
yarbis = YarbisPersonality()
orchestrator = SkillOrchestrator()


@app.call_tool()
async def chat(context: RequestContext, message: str) -> str:
    """
    Main chat endpoint - routes user requests to appropriate skills.

    Args:
        message: User's natural language request

    Returns:
        Yarbis's response with action taken or info needed
    """
    # Parse intent from message
    intent = orchestrator.detect_intent(message)

    response = {
        "status": "processing",
        "message": yarbis.get_thinking_phrase(),
        "intent": intent,
    }

    # Route to appropriate handler
    if intent == "new_student":
        result = await orchestrator.handle_new_student(message)
        response.update(result)

    elif intent == "generate_receipt":
        result = await orchestrator.handle_receipt_generation(message)
        response.update(result)

    elif intent == "insurance_form":
        result = await orchestrator.handle_insurance_form(message)
        response.update(result)

    elif intent == "attendance_sheet":
        result = await orchestrator.handle_attendance_sheet(message)
        response.update(result)

    elif intent == "help":
        response["message"] = get_help_text()
        response["status"] = "info"

    else:
        response["message"] = "No entendí bien, boludo. ¿Podés ser más específico?"
        response["status"] = "need_clarification"

    return json.dumps(response, ensure_ascii=False, indent=2)


@app.call_tool()
async def invoke_skill(context: RequestContext, skill_name: str, params: dict) -> str:
    """
    Invoke a specific Club Juntos skill.

    Args:
        skill_name: Name of the skill to invoke
        params: Parameters for the skill

    Returns:
        Result from the skill
    """
    try:
        result = await orchestrator.invoke_skill(skill_name, params)
        return json.dumps(
            {
                "status": "success",
                "message": yarbis.get_affirmation(),
                "data": result,
            },
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps(
            {
                "status": "error",
                "message": f"{yarbis.get_error_message()} Error: {str(e)}",
                "error": str(e),
            },
            ensure_ascii=False,
        )


@app.call_tool()
async def list_available_skills() -> str:
    """List all available Club Juntos skills that Yarbis can invoke."""
    skills = orchestrator.get_available_skills()
    return json.dumps(
        {
            "status": "success",
            "skills": skills,
            "message": f"Tengo {len(skills)} skills disponibles, boludo",
        },
        ensure_ascii=False,
        indent=2,
    )


@app.call_tool()
async def get_student_status(context: RequestContext, student_id: str) -> str:
    """Get current status of a student."""
    try:
        status = await orchestrator.get_student_status(student_id)
        return json.dumps(
            {
                "status": "success",
                "data": status,
                "message": yarbis.get_affirmation(),
            },
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps(
            {
                "status": "error",
                "message": f"{yarbis.get_error_message()}: {str(e)}",
            },
            ensure_ascii=False,
        )


def get_help_text() -> str:
    """Return help text for available commands."""
    return """
🤖 **Yarbis - Tu asistente de Club Juntos**

Estos son los comandos que manejo:

📝 **Gestión de Alumnos:**
- "Ingresar alumno nuevo" → Nuevo alumno al sistema
- "Ver estado de [nombre]" → Chequear info del alumno
- "Renovar alumno" → Renovar membresía

💰 **Recibos:**
- "Generar recibo para [nombre]" → Crear recibo
- "Recibos pendientes" → Ver recibos sin pagar

📋 **Obras Sociales:**
- "Completar formulario de [obra social]" → Auto-completa formularios
- "Listar obras sociales" → Ver integradas

📊 **Planillas:**
- "Asistencia del mes" → Planilla de asistencia
- "Crear planilla" → Nueva planilla

🔧 **Utilidades:**
- "Ayuda" → Este menú
- "Qué podés hacer?" → Mis funciones

¿Qué necesitás hacer hoy?
"""


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
