import { EmailClient } from '@azure/communication-email';

function emailConnectionString(): string {
  const value = process.env.ACS_CONNECTION_STRING ?? '';
  if (!value) throw new Error('ACS_CONNECTION_STRING is not configured');
  return value;
}

function senderAddress(): string {
  const value = process.env.SIGNUP_EMAIL_SENDER ?? '';
  if (!value) throw new Error('SIGNUP_EMAIL_SENDER is not configured');
  return value;
}

export async function sendSignupConfirmationEmail(input: {
  to: string;
  firstName?: string;
}): Promise<void> {
  const client = new EmailClient(emailConnectionString());
  const greetingName = input.firstName?.trim() || 'there';

  const poller = await client.beginSend({
    senderAddress: senderAddress(),
    recipients: {
      to: [{ address: input.to }],
    },
    content: {
      subject: 'We have received your LMS sign-up request',
      plainText: `Hi ${greetingName},

Thanks for your interest in 365 Evergreen LMS.

We have received your sign-up request and will review it shortly. If approved, we will send a separate invitation email with next steps for accessing the platform.

Kind regards,
365 Evergreen LMS`,
      html: `<p>Hi ${escapeHtml(greetingName)},</p>
<p>Thanks for your interest in <strong>365 Evergreen LMS</strong>.</p>
<p>We have received your sign-up request and will review it shortly. If approved, we will send a separate invitation email with next steps for accessing the platform.</p>
<p>Kind regards,<br />365 Evergreen LMS</p>`,
    },
  });

  const result = await poller.pollUntilDone();
  if (result.status !== 'Succeeded') {
    throw new Error(result.error?.message || `Email send failed with status ${result.status}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
