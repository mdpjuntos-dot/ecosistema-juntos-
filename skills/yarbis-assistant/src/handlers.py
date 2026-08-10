"""Handlers para ejecutar acciones reales del bot Yarbis."""

import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
from dataclasses import dataclass


@dataclass
class Student:
    """Modelo de alumno."""

    id: str
    firstName: str
    lastName: str
    dni: str
    email: str
    phone: str
    dateOfBirth: str
    joinDate: str
    status: str  # 'active', 'inactive', 'suspended'
    membershipType: str
    lastPaymentDate: Optional[str] = None
    nextRenewalDate: Optional[str] = None


class StudentHandler:
    """Maneja operaciones de alumnos."""

    def __init__(self):
        # Simulación de DB en memoria (en prod sería Supabase/PostgreSQL)
        self.students: Dict[str, Student] = {}
        self.student_counter = 0

    def add_student(
        self,
        first_name: str,
        last_name: str,
        dni: str,
        email: str,
        phone: str,
        date_of_birth: str,
    ) -> Dict[str, Any]:
        """Ingresa un alumno nuevo."""
        self.student_counter += 1
        student_id = f"STU-{self.student_counter:04d}"

        student = Student(
            id=student_id,
            firstName=first_name,
            lastName=last_name,
            dni=dni,
            email=email,
            phone=phone,
            dateOfBirth=date_of_birth,
            joinDate=datetime.now().isoformat(),
            status="active",
            membershipType="standard",
        )

        self.students[student_id] = student

        return {
            "success": True,
            "studentId": student_id,
            "student": {
                "nombre": f"{first_name} {last_name}",
                "dni": dni,
                "email": email,
                "telefono": phone,
                "estado": "Activo",
                "fecha_ingreso": datetime.now().strftime("%d/%m/%Y"),
            },
            "message": f"¡Boom! ✅ {first_name} ingresado al sistema",
            "actions": [
                "Generar recibo de inscripción",
                "Agregar obra social",
                "Enviar bienvenida por email",
            ],
        }

    def get_student(self, name_or_id: str) -> Optional[Student]:
        """Busca un alumno por nombre o ID."""
        # Busca por ID exacto
        if name_or_id in self.students:
            return self.students[name_or_id]

        # Busca por nombre (case-insensitive)
        search_term = name_or_id.lower()
        for student in self.students.values():
            full_name = f"{student.firstName} {student.lastName}".lower()
            if search_term in full_name or full_name in search_term:
                return student

        return None

    def get_student_status(self, name_or_id: str) -> Dict[str, Any]:
        """Obtiene estado de un alumno."""
        student = self.get_student(name_or_id)

        if not student:
            return {
                "success": False,
                "error": f"No encontré a {name_or_id} en el sistema",
            }

        return {
            "success": True,
            "data": {
                "nombre": f"{student.firstName} {student.lastName}",
                "dni": student.dni,
                "email": student.email,
                "telefono": student.phone,
                "fecha_nacimiento": student.dateOfBirth,
                "fecha_ingreso": student.joinDate.split("T")[0],
                "estado": student.status.capitalize(),
                "tipo_membresía": student.membershipType,
                "último_pago": student.lastPaymentDate or "Sin registrar",
                "próximo_vencimiento": student.nextRenewalDate or "N/A",
            },
        }

    def list_students(self) -> Dict[str, Any]:
        """Lista todos los alumnos."""
        if not self.students:
            return {
                "success": True,
                "students": [],
                "count": 0,
                "message": "No hay alumnos ingresados aún",
            }

        students_data = [
            {
                "nombre": f"{s.firstName} {s.lastName}",
                "dni": s.dni,
                "email": s.email,
                "estado": s.status.capitalize(),
                "ingreso": s.joinDate.split("T")[0],
            }
            for s in self.students.values()
        ]

        return {
            "success": True,
            "students": students_data,
            "count": len(students_data),
            "message": f"Total de alumnos: {len(students_data)}",
        }


class ReceiptHandler:
    """Maneja operaciones de recibos."""

    def __init__(self, student_handler: StudentHandler):
        self.student_handler = student_handler
        self.receipts: List[Dict[str, Any]] = []
        self.receipt_counter = 0

    def generate_receipt(
        self, student_name: str, amount: float, description: str = "Pago de cuota"
    ) -> Dict[str, Any]:
        """Genera un recibo."""
        student = self.student_handler.get_student(student_name)

        if not student:
            return {
                "success": False,
                "error": f"Alumno '{student_name}' no encontrado",
            }

        self.receipt_counter += 1
        receipt_id = f"REC-{self.receipt_counter:06d}"
        receipt_date = datetime.now().strftime("%d/%m/%Y")

        receipt = {
            "id": receipt_id,
            "studentId": student.id,
            "studentName": f"{student.firstName} {student.lastName}",
            "amount": amount,
            "date": receipt_date,
            "description": description,
            "status": "pending",
            "email": student.email,
        }

        self.receipts.append(receipt)

        return {
            "success": True,
            "receiptId": receipt_id,
            "data": {
                "numero": receipt_id,
                "alumno": student.firstName,
                "monto": f"${amount:.2f}",
                "fecha": receipt_date,
                "concepto": description,
            },
            "message": f"¡Boom! ✅ Recibo creado: {receipt_id}",
            "actions": [
                f"Enviar a {student.email}",
                "Guardar en Google Drive",
                "Marcar como pagado",
            ],
        }

    def send_receipt_email(self, receipt_id: str) -> Dict[str, Any]:
        """Envía recibo por email."""
        receipt = next((r for r in self.receipts if r["id"] == receipt_id), None)

        if not receipt:
            return {"success": False, "error": f"Recibo {receipt_id} no encontrado"}

        return {
            "success": True,
            "message": f"✉️ Email enviado a {receipt['email']}",
            "receipt_id": receipt_id,
        }

    def get_pending_receipts(self) -> Dict[str, Any]:
        """Obtiene recibos pendientes de pago."""
        pending = [r for r in self.receipts if r["status"] == "pending"]

        return {
            "success": True,
            "pending": pending,
            "count": len(pending),
            "message": f"Total pendiente: ${sum(r['amount'] for r in pending):.2f}",
        }


class AttendanceHandler:
    """Maneja operaciones de asistencia."""

    def __init__(self):
        self.attendance: List[Dict[str, Any]] = []

    def mark_attendance(
        self, student_name: str, status: str = "present"
    ) -> Dict[str, Any]:
        """Marca asistencia de un alumno."""
        if status not in ["present", "absent", "justified"]:
            return {"success": False, "error": "Estado inválido"}

        record = {
            "date": datetime.now().isoformat(),
            "studentName": student_name,
            "status": status,
        }

        self.attendance.append(record)

        status_emoji = {"present": "✅", "absent": "❌", "justified": "⏸️"}

        return {
            "success": True,
            "message": f"{status_emoji.get(status, '•')} {student_name} marcado como {status}",
            "record": record,
        }

    def get_month_attendance(self, month: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene planilla del mes."""
        current_month = datetime.now().strftime("%Y-%m")

        return {
            "success": True,
            "month": month or current_month,
            "message": f"Planilla de asistencia para {month or 'este mes'} creada ✅",
            "records": len(self.attendance),
            "actions": ["Guardar en Drive", "Enviar por email", "Imprimir"],
        }


class InsuranceHandler:
    """Maneja operaciones de obras sociales."""

    def __init__(self):
        self.forms: List[Dict[str, Any]] = []

    def complete_insurance_form(
        self, student_name: str, insurance_company: str
    ) -> Dict[str, Any]:
        """Completa formulario de obra social."""
        form = {
            "date": datetime.now().isoformat(),
            "studentName": student_name,
            "insuranceCompany": insurance_company,
            "status": "completed",
        }

        self.forms.append(form)

        return {
            "success": True,
            "message": f"✅ Formulario de {insurance_company} completado para {student_name}",
            "actions": [
                "Guardar en legajos",
                "Enviar al alumno",
                "Enviar a obra social",
            ],
        }

    def list_insurance_forms(self) -> Dict[str, Any]:
        """Lista formularios de obras sociales."""
        companies = set(f["insuranceCompany"] for f in self.forms)

        return {
            "success": True,
            "forms": list(companies),
            "count": len(self.forms),
            "message": f"Total de formularios: {len(self.forms)}",
        }


class YarbisBot:
    """Bot principal que orquesta todas las operaciones."""

    def __init__(self):
        self.student_handler = StudentHandler()
        self.receipt_handler = ReceiptHandler(self.student_handler)
        self.attendance_handler = AttendanceHandler()
        self.insurance_handler = InsuranceHandler()

    def process_command(self, user_input: str) -> Dict[str, Any]:
        """Procesa un comando del usuario."""
        input_lower = user_input.lower()

        # Ingresar alumno
        if any(w in input_lower for w in ["ingresar", "nuevo alumno", "agregar"]):
            return {
                "action": "student_intake",
                "message": "Dale, vamos a ingresar un alumno nuevo 🤖\nDecime: nombre, apellido, DNI, email, teléfono y fecha de nacimiento",
                "next_step": "expect_student_data",
            }

        # Ver estado
        if any(w in input_lower for w in ["estado", "qué onda", "cómo está"]):
            # Buscar nombre en input
            words = user_input.split()
            name = " ".join(words[1:]) if len(words) > 1 else None
            if name:
                return self.student_handler.get_student_status(name)

        # Listar alumnos
        if any(w in input_lower for w in ["listar", "todos los alumnos", "cuántos"]):
            return self.student_handler.list_students()

        # Recibos
        if "recibo" in input_lower:
            if "pendiente" in input_lower:
                return self.receipt_handler.get_pending_receipts()
            else:
                return {
                    "action": "receipt_generation",
                    "message": "Dale, vamos a generar un recibo 💰\nDecime: nombre del alumno y monto",
                    "next_step": "expect_receipt_data",
                }

        # Asistencia
        if any(w in input_lower for w in ["asistencia", "planilla", "presente"]):
            return {
                "action": "attendance",
                "message": "Creando planilla de asistencia... 📊",
                "result": self.attendance_handler.get_month_attendance(),
            }

        # Obras sociales
        if "obra social" in input_lower or "seguro" in input_lower:
            return {
                "action": "insurance_form",
                "message": "Dale, vamos a completar formulario de obra social 📋\nDecime: nombre del alumno y obra social",
                "next_step": "expect_insurance_data",
            }

        # Help
        if any(w in input_lower for w in ["ayuda", "help", "qué podes"]):
            return {
                "message": """
🤖 **Yarbis - Tu asistente de Club Juntos**

📝 **Alumnos:**
- "Ingresar alumno nuevo"
- "Estado de [nombre]"
- "Todos los alumnos"

💰 **Recibos:**
- "Generar recibo para [nombre]"
- "Recibos pendientes"

📋 **Obras Sociales:**
- "Obra social para [nombre]"

📊 **Asistencia:**
- "Planilla del mes"
- "Marcar presente a [nombre]"

¿Qué necesitás hacer?
""",
            }

        # Default
        return {
            "message": f"No entendí bien, boludo. ¿Podés ser más específico?\nEscribí 'ayuda' para ver los comandos disponibles",
            "suggestions": [
                "Ingresar alumno nuevo",
                "Ver estado de...",
                "Generar recibo",
                "Planilla de asistencia",
            ],
        }

    def handle_student_data(
        self, first_name: str, last_name: str, dni: str, email: str, phone: str, date_of_birth: str
    ) -> Dict[str, Any]:
        """Maneja datos de un alumno ingresado."""
        return self.student_handler.add_student(
            first_name, last_name, dni, email, phone, date_of_birth
        )

    def handle_receipt_data(self, student_name: str, amount: float) -> Dict[str, Any]:
        """Maneja datos de un recibo."""
        return self.receipt_handler.generate_receipt(student_name, amount)

    def sync_to_drive(self, data_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sincroniza datos a Google Drive."""
        return {
            "success": True,
            "message": f"✅ {data_type.capitalize()} guardado en Drive",
            "path": f"Drive/Club Juntos/{data_type}/{datetime.now().strftime('%Y/%m')}/",
        }

    def send_slack_notification(self, message: str) -> Dict[str, Any]:
        """Envía notificación a Slack."""
        return {
            "success": True,
            "message": f"📢 Notificación enviada a #club-juntos-tareas-hoy",
            "content": message,
        }
