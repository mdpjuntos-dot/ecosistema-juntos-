'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import InputField from './InputField';
import CommandPalette from './CommandPalette';
import { getDatabase } from '@/lib/database';
import { getGoogleIntegration } from '@/lib/integrations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: string;
  formType?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Ey! Yo soy Yarbis, tu AI con onda 🤖\n\n¿Qué necesitás hacer hoy? Puedo ayudarte con:\n• 📝 Ingresar alumnos nuevos\n• 💰 Generar recibos\n• 📋 Completar formularios de obras sociales\n• 📊 Crear planillas de asistencia\n• 🔍 Ver reportes y estadísticas\n\n¿Vamos a empezar?',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [awaitingData, setAwaitingData] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const db = getDatabase();
  const google = getGoogleIntegration();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processCommand = async (text: string) => {
    const textLower = text.toLowerCase();
    const db = getDatabase();

    // Ingresar alumno
    if (
      textLower.includes('ingresar') ||
      textLower.includes('nuevo alumno')
    ) {
      setAwaitingData('student_data');
      return {
        message:
          '¡Dale! Vamos a ingresar un alumno nuevo 🎓\nDecime: nombre completo, DNI, email, teléfono y fecha de nacimiento\n(ej: Juan García, 45123456, juan@gmail.com, 1123456789, 15/05/2010)',
        action: 'awaiting_data',
      };
    }

    // Procesar datos de alumno
    if (awaitingData === 'student_data') {
      const parts = text.split(',').map((p) => p.trim());
      if (parts.length >= 5) {
        const student = db.addStudent({
          firstName: parts[0].split(' ')[0],
          lastName: parts[0].split(' ').slice(1).join(' '),
          dni: parts[1],
          email: parts[2],
          phone: parts[3],
          dateOfBirth: parts[4],
          joinDate: new Date().toISOString(),
          status: 'active',
          membershipType: 'standard',
        });

        setAwaitingData(null);

        // Sync to Google Drive (simulated)
        await google.createFolder(`Legajos/${student.dni}`, 'legajos-folder');

        // Send email notification (simulated)
        await google.sendEmail(
          student.email,
          '¡Bienvenida a Club Juntos!',
          `Hola ${student.firstName}, ¡Te has ingresado exitosamente! Tu ID de alumno es: ${student.id}`
        );

        return {
          message: `¡Boom! ✅ ${student.firstName} ingresado al sistema\n\n📋 Datos:\n- ID: ${student.id}\n- Email: ${student.email}\n- Tel: ${student.phone}\n- Ingreso: ${new Date().toLocaleDateString('es-AR')}\n\n¿Generamos recibo de inscripción?`,
          action: 'student_created',
          studentId: student.id,
        };
      }
      return {
        message: 'Necesito más datos, boludo. Decime: nombre, DNI, email, teléfono y fecha de nacimiento',
        action: 'awaiting_data',
      };
    }

    // Ver estado de alumno
    if (textLower.includes('estado') || textLower.includes('qué onda')) {
      const nameMatch = text.match(/(?:de|:)\s+(.+?)$/);
      if (nameMatch) {
        const student = db.findStudent(nameMatch[1]);
        if (student) {
          const receipts = db.getReceiptsByStudent(student.id);
          const totalDebt = receipts
            .filter((r) => r.status !== 'paid')
            .reduce((sum, r) => sum + r.amount, 0);

          return {
            message: `📋 **Estado de ${student.firstName} ${student.lastName}**\n\n- ID: ${student.id}\n- DNI: ${student.dni}\n- Email: ${student.email}\n- Teléfono: ${student.phone}\n- Fecha Ingreso: ${new Date(student.joinDate).toLocaleDateString('es-AR')}\n- Estado: ${student.status.toUpperCase()}\n- Deuda Total: $${totalDebt}`,
            action: 'student_info',
          };
        }
      }
      return {
        message: 'No encontré el alumno. ¿Podés decirme el nombre completo?',
        action: 'need_clarification',
      };
    }

    // Listar todos los alumnos
    if (
      textLower.includes('todos') ||
      textLower.includes('listar') ||
      textLower.includes('cuántos')
    ) {
      const students = db.getAllStudents();
      const active = students.filter((s) => s.status === 'active').length;

      if (students.length === 0) {
        return {
          message: 'No hay alumnos ingresados aún. ¿Querés ingresar uno?',
          action: 'no_data',
        };
      }

      const list = students
        .map(
          (s) =>
            `- ${s.firstName} ${s.lastName} (${s.dni}) - ${s.status.toUpperCase()}`
        )
        .join('\n');

      return {
        message: `📊 **Total de Alumnos: ${students.length} (${active} activos)**\n\n${list}`,
        action: 'list_students',
      };
    }

    // Generar recibo
    if (textLower.includes('recibo')) {
      const nameMatch = text.match(/para\s+(.+?)(?:\s+de\s+)?(\d+)?/);
      if (nameMatch) {
        const student = db.findStudent(nameMatch[1]);
        const amount = nameMatch[2] ? parseInt(nameMatch[2]) : null;

        if (student && amount) {
          const receipt = db.addReceipt({
            studentId: student.id,
            amount,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            description: 'Cuota mensual',
          });

          // Send email (simulated)
          await google.sendEmail(
            student.email,
            `Recibo de Pago - ${receipt.id}`,
            `Tu recibo de $${amount} ha sido generado.`
          );

          return {
            message: `¡Boom! ✅ Recibo generado\n\n💳 **${receipt.id}**\n- Alumno: ${student.firstName} ${student.lastName}\n- Monto: $${amount}\n- Fecha: ${new Date().toLocaleDateString('es-AR')}\n- Email enviado ✉️\n- Guardado en Drive 💾`,
            action: 'receipt_generated',
            receiptId: receipt.id,
          };
        }
      }

      const pending = db.getPendingReceipts();
      if (textLower.includes('pendiente')) {
        return {
          message: `📋 **Recibos Pendientes: ${pending.length}**\n\nDeuda Total: $${pending.reduce((s, r) => s + r.amount, 0)}\n\n${pending
            .map((r) => `- ${r.id}: $${r.amount}`)
            .join('\n')}`,
          action: 'pending_receipts',
        };
      }

      return {
        message: 'Decime: "Recibo para [nombre] de $[monto]"',
        action: 'need_clarification',
      };
    }

    // Estadísticas
    if (
      textLower.includes('reporte') ||
      textLower.includes('estadísticas') ||
      textLower.includes('estadistica')
    ) {
      const stats = db.getStatistics();
      return {
        message: `📊 **Estadísticas de Club Juntos**\n\n👥 Alumnos: ${stats.totalStudents} (${stats.activeStudents} activos)\n💰 Recibos: ${stats.totalReceipts}\n📋 Deuda: $${stats.totalDebt}\n✅ Cobrado: $${stats.totalCollected}\n📈 Asistencias: ${stats.attendanceRecords}`,
        action: 'statistics',
      };
    }

    // Ayuda
    if (textLower.includes('ayuda') || textLower.includes('help')) {
      return {
        message: `🤖 **Yarbis - Tu Asistente de Club Juntos**\n\n**Comandos:**\n📝 "Ingresar alumno nuevo" - Nuevo alumno\n🔍 "Estado de [nombre]" - Info del alumno\n"Todos los alumnos" - Listar activos\n💰 "Recibo para [nombre] de $[monto]" - Generar\n"Recibos pendientes" - Deudores\n📊 "Reportes" - Estadísticas\n\n¿Qué necesitás?`,
        action: 'help',
      };
    }

    // Default - ask Claude
    return null;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Try to process locally first
      const localResponse = await processCommand(text);

      if (localResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse.message,
          timestamp: new Date(),
          action: localResponse.action,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fall back to Claude API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userMessage: text,
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message || data.content,
          timestamp: new Date(),
          action: data.action,
          formType: data.formType,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Uh, metí la pata 😅 No pude procesar tu solicitud. Intentá de nuevo, boludo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.map((message, index) => (
          <ChatMessage key={message.id} message={message} isLast={index === messages.length - 1} />
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-slate-400">
            <div className="typing-indicator flex gap-1">
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
              <span className="inline-block w-2 h-2 bg-yarbis-500 rounded-full"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 py-4 border-t border-slate-700 bg-slate-800">
          <p className="text-xs text-slate-400 mb-3">Acciones rápidas:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction('Ingresar alumno nuevo')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              📝 Nuevo Alumno
            </button>
            <button
              onClick={() => handleQuickAction('Generar recibo')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              💰 Recibos
            </button>
            <button
              onClick={() => handleQuickAction('Todos los alumnos')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              👥 Alumnos
            </button>
            <button
              onClick={() => handleQuickAction('Reportes')}
              className="p-2 text-sm bg-yarbis-600 hover:bg-yarbis-700 rounded text-white transition-colors"
            >
              📊 Reportes
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <InputField onSend={sendMessage} disabled={loading} />
    </div>
  );
}
