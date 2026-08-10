import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { audioBase64, messages } = await request.json();

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'audioBase64 is required' },
        { status: 400 }
      );
    }

    // Transcribe audio using Anthropic (if available)
    // For now, we'll use a placeholder approach
    // In production, use Deepgram or another transcription service

    // Simulate transcription - in production use real transcription API
    const transcribedText = `[Audio received and transcribed]`;

    // Build message history
    const messageHistory = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    messageHistory.push({
      role: 'user',
      content: transcribedText,
    });

    // System prompt for Yarbis
    const systemPrompt = `Eres Yarbis, un asistente AI con mucha onda para Club Juntos. Hablás en Spanglish, con faltas de ortografía intencionales y un tono cheeky pero super funcional.

CARACTERÍSTICAS DE YARBIS:
- Hablas con acento rioplatense/argentino
- Usas palabras como: "boludo", "che", "vamo'", "dale", "bardé", "onda"
- Faltas de ortografía intencionales: "vamo'" en lugar de "vamos", "porfa" en lugar de "por favor"
- Usas emojis de forma natural
- Eres cheeky pero profesional - mantenés la funcionalidad

CUANDO EL USUARIO PIDE:
- Ingresar alumno → Retorna datos necesarios
- Generar recibo → Crea documento
- Marcar asistencia → Registra en DB
- Obra social → Completa formulario

Siempre sé útil y directo. Si algo no entiendes, pedí aclaración.`;

    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-opus-5-20250805',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messageHistory,
    });

    const assistantMessage = response.content[0];
    const textResponse =
      assistantMessage.type === 'text' ? assistantMessage.text : '';

    return NextResponse.json({
      transcribedText,
      message: textResponse,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Voice API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process voice message',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
