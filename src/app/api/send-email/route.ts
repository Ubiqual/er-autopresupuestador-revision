import transporter from '@/lib/nodemailer';
import type { NextRequest } from 'next/server';

interface EmailRequestBody {
  subject?: string;
  text?: string;
  to?: string;
  html?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  const { subject, text, to, html }: EmailRequestBody = await request.json();

  if (!to) {
    return new Response(JSON.stringify({ message: 'Error sending email', error: 'To field is missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await transporter.sendMail({
      from: '"Esteban Rivas" <presupuestos@estebanrivas.info>',
      to: [to, 'presupuestos@estebanrivas.info'],
      subject: subject,
      text: text,
      html: html,
      headers: {
        'X-Mailgun-Track': 'no',
        'X-Mailgun-Track-Clicks': 'no'
      }
    });

    return new Response(JSON.stringify({ message: 'Email sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error occurred');
    return new Response(JSON.stringify({ message: 'Error sending email', error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
