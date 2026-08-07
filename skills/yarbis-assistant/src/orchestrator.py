"""Skill orchestrator - routes requests to appropriate Club Juntos skills."""

import re
from typing import Dict, Optional, Any, List
from enum import Enum


class Intent(Enum):
    """User intent types."""

    NEW_STUDENT = "new_student"
    GENERATE_RECEIPT = "generate_receipt"
    INSURANCE_FORM = "insurance_form"
    ATTENDANCE_SHEET = "attendance_sheet"
    STUDENT_STATUS = "student_status"
    HELP = "help"
    UNKNOWN = "unknown"


class SkillOrchestrator:
    """Orchestrates calls to Club Juntos skills."""

    # Available skills mapping
    AVAILABLE_SKILLS = {
        "ingreso-alumnos": {
            "name": "club-juntos-ingreso-alumnos",
            "description": "Gestión completa de ingreso, renovación y pagos de alumnos",
        },
        "recibos": {
            "name": "club-juntos-generador-recibos",
            "description": "Generador de recibos profesionales",
        },
        "obras-sociales": {
            "name": "completador-obras-sociales-generico",
            "description": "Auto-completa formularios de obras sociales",
        },
        "planillas": {
            "name": "creador-de-planillas",
            "description": "Crea planillas de asistencia",
        },
    }

    def __init__(self):
        """Initialize the orchestrator."""
        self.student_cache = {}
        self.pending_operations = {}

    def detect_intent(self, message: str) -> Intent:
        """Detect user intent from message."""
        message_lower = message.lower()

        # New student patterns
        if any(
            phrase in message_lower
            for phrase in ["ingresar", "nuevo alumno", "nuevo estudiante", "agregar"]
        ):
            return Intent.NEW_STUDENT

        # Receipt patterns
        if any(
            phrase in message_lower
            for phrase in ["recibo", "factura", "comprobante", "payment"]
        ):
            return Intent.GENERATE_RECEIPT

        # Insurance patterns
        if any(
            phrase in message_lower
            for phrase in ["obra social", "seguro", "cobertura", "insurance"]
        ):
            return Intent.INSURANCE_FORM

        # Attendance patterns
        if any(
            phrase in message_lower
            for phrase in ["asistencia", "planilla", "attendance", "sheet"]
        ):
            return Intent.ATTENDANCE_SHEET

        # Status patterns
        if any(
            phrase in message_lower
            for phrase in ["estado", "status", "ver", "chequear"]
        ):
            return Intent.STUDENT_STATUS

        # Help patterns
        if any(
            phrase in message_lower for phrase in ["ayuda", "help", "qué podes", "commands"]
        ):
            return Intent.HELP

        return Intent.UNKNOWN

    async def handle_new_student(self, message: str) -> Dict[str, Any]:
        """Handle new student intake flow."""
        return {
            "status": "success",
            "message": "Dale, vamos a ingresar un alumno nuevo",
            "action": "open_form",
            "form_type": "student_intake",
            "fields_required": [
                "nombre",
                "apellido",
                "dni",
                "email",
                "telefono",
                "fecha_nacimiento",
            ],
            "skill_to_invoke": "ingreso-alumnos",
        }

    async def handle_receipt_generation(self, message: str) -> Dict[str, Any]:
        """Handle receipt generation request."""
        # Extract student name if mentioned
        student_name = self._extract_student_name(message)

        return {
            "status": "success",
            "message": "Generando recibo...",
            "action": "generate_receipt",
            "student_name": student_name,
            "skill_to_invoke": "recibos",
            "delivery_options": ["email", "whatsapp", "drive"],
        }

    async def handle_insurance_form(self, message: str) -> Dict[str, Any]:
        """Handle insurance form completion."""
        # Extract insurance company if mentioned
        insurance_company = self._extract_insurance_company(message)

        return {
            "status": "success",
            "message": f"Voy a completar el formulario de {insurance_company or 'obra social'}",
            "action": "complete_insurance_form",
            "insurance_company": insurance_company,
            "skill_to_invoke": "obras-sociales",
            "requires_upload": True,
        }

    async def handle_attendance_sheet(self, message: str) -> Dict[str, Any]:
        """Handle attendance sheet creation."""
        # Extract month if mentioned
        month = self._extract_month(message)

        return {
            "status": "success",
            "message": f"Creando planilla de asistencia para {month or 'este mes'}",
            "action": "create_attendance_sheet",
            "month": month,
            "skill_to_invoke": "planillas",
            "auto_sync_drive": True,
        }

    async def get_student_status(self, student_id: str) -> Dict[str, Any]:
        """Get student status information."""
        # This would query the actual database
        return {
            "student_id": student_id,
            "status": "active",
            "last_payment": "2026-08-01",
            "next_renewal": "2026-09-01",
            "attendance_rate": 85,
        }

    async def invoke_skill(self, skill_name: str, params: dict) -> Dict[str, Any]:
        """
        Invoke a specific Club Juntos skill.

        This is a placeholder - actual implementation would call the skill API.
        """
        if skill_name not in self.AVAILABLE_SKILLS:
            raise ValueError(f"Skill '{skill_name}' not found")

        skill = self.AVAILABLE_SKILLS[skill_name]

        # Placeholder result
        return {
            "skill": skill["name"],
            "params": params,
            "status": "executed",
            "result": f"Skill {skill_name} executed successfully",
        }

    def get_available_skills(self) -> List[Dict[str, str]]:
        """Get list of available skills."""
        return [
            {"key": key, **value} for key, value in self.AVAILABLE_SKILLS.items()
        ]

    def _extract_student_name(self, message: str) -> Optional[str]:
        """Extract student name from message."""
        # Simple pattern matching - could be enhanced with NER
        patterns = [
            r"(?:para|de)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        ]

        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                return match.group(1)

        return None

    def _extract_insurance_company(self, message: str) -> Optional[str]:
        """Extract insurance company from message."""
        companies = [
            "osde",
            "buscadent",
            "swiss",
            "medicus",
            "apres",
            "iplan",
            "prevención salud",
        ]

        message_lower = message.lower()
        for company in companies:
            if company in message_lower:
                return company

        return None

    def _extract_month(self, message: str) -> Optional[str]:
        """Extract month from message."""
        months = {
            "enero": "01",
            "febrero": "02",
            "marzo": "03",
            "abril": "04",
            "mayo": "05",
            "junio": "06",
            "julio": "07",
            "agosto": "08",
            "septiembre": "09",
            "octubre": "10",
            "noviembre": "11",
            "diciembre": "12",
        }

        message_lower = message.lower()
        for month_name, month_num in months.items():
            if month_name in message_lower:
                return month_name

        return None
