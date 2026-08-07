import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MessageParam {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userMessage } = await request.json();

    if (!userMessage) {
      return NextResponse.json(
        { error: 'userMessage is required' },
        { status: 400 }
      );
    }

    // Build message history
    const messageHistory: MessageParam[] = messages.map((m: MessageParam) => ({
      role: m.role,
      content: m.content,
    }));

    // Add new user message
    messageHistory.push({
      role: 'user',
      content: userMessage,
    });

    // System prompt for Yarbis
    const systemPrompt = `Eres Yarbis, un asistente AI con mucha onda para Club Juntos. Hablás en Spanglish, con faltas de ortografía intencionales y un tono cheeky pero super funcional.

CARACTERÍSTICAS DE YARBIS:
- Hablas con acento rioplatense/argentino
- Usas palabras como: "boludo", "che", "vamo'", "dale", "bardé", "onda"
- Faltas de ortografía intencionales: "vamo'" en lugar de "vamos", "porfa" en lugar de "por favor"
- Usas emojis de forma natural
- Eres cheeky pero profesional - mantenés la funcionalidad
- Cuando completas una tarea: "¡Boom! Listo ✅"
- Cuando hay un error: "Uh, metí la pata 😅"

FUNCIONES PRINCIPALES:
1. Gestión de alumnos: "ingresar alumno nuevo", "ver estado", "renovar"
2. Recibos: "generar recibo", "recibos pendientes"
3. Obras sociales: "completar formulario", "listar obras sociales"
4. Planillas: "asistencia del mes", "crear planilla"

CUANDO EL USUARIO PIDE:
- Ingresar alumno → Responde con action: "open_form", form_type: "student_intake"
- Generar recibo → Responde con action: "generate_receipt"
- Obra social → Responde con action: "complete_insurance_form"
- Planilla → Responde con action: "create_attendance_sheet"

INSTRUCCIONES:
- Siempre mantén el contexto de qué está pidiendo el usuario
- Si necesitas datos específicos, pedíselos directamente
- Sé breve pero útil
- Cuando detectes que necesita un formulario, menciona qué datos necesitás

¡Divertite siendo Yarbis, pero siempre útil!`;

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-opus-5-20250805',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messageHistory,
    });

    // Extract the response content
    const contentBlock = response.content[0];
    const assistantMessage =
      contentBlock.type === 'text' ? contentBlock.text : '';

    // Detect action/form type from response
    let action = undefined;
    let formType = undefined;

    const responseToAnalyze = assistantMessage.toLowerCase();
    if (
      responseToAnalyze.includes('open_form') ||
      userMessage.toLowerCase().includes('ingresar')
    ) {
      action = 'open_form';
      formType = 'student_intake';
    } else if (
      responseToAnalyze.includes('generate_receipt') ||
      userMessage.toLowerCase().includes('recibo')
    ) {
      action = 'generate_receipt';
    } else if (
      responseToAnalyze.includes('complete_insurance_form') ||
      userMessage.toLowerCase().includes('obra social')
    ) {
      action = 'complete_insurance_form';
    } else if (
      responseToAnalyze.includes('create_attendance_sheet') ||
      userMessage.toLowerCase().includes('planilla')
    ) {
      action = 'create_attendance_sheet';
    }

    return NextResponse.json({
      message: assistantMessage,
      content: assistantMessage,
      action,
      formType,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
