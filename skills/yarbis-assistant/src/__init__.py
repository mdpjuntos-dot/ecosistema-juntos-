"""Yarbis Assistant - Bot funcional para Club Juntos."""

from .main import chat, add_student, generate_receipt, list_students, get_student_status
from .handlers import YarbisBot
from .personality import YarbisPersonality

__version__ = "0.1.0"
__all__ = [
    "chat",
    "add_student",
    "generate_receipt",
    "list_students",
    "get_student_status",
    "YarbisBot",
    "YarbisPersonality",
]
