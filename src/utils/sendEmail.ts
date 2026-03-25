export const sendEmail = async (to: string, subject: string, html?: string): Promise<boolean> => {
  const emailResponse = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, subject, html })
  });

  return emailResponse.ok;
};
