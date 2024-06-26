import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';

export async function fetchEmailsGoogle(auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({ userId: 'me' });
  return res.data.messages || [];
}

export async function fetchEmailsOutlook(token: string) {
  const client = Client.init({
    authProvider: (done) => done(null, token),
  });

  const res = await client.api('/me/messages').get();
  return res.value || [];
}

export async function sendEmailGoogle(auth: any, to: string, subject: string, message: string) {
  const gmail = google.gmail({ version: 'v1', auth });
  const email = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    message,
  ].join('\n');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: Buffer.from(email).toString('base64'),
    },
  });

  return res;
}

export async function sendEmailOutlook(token: string, to: string, subject: string, message: string) {
  const client = Client.init({
    authProvider: (done) => done(null, token),
  });

  const email = {
    message: {
      subject: subject,
      body: {
        contentType: 'Text',
        content: message,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
  };

  const res = await client.api('/me/sendMail').post(email);
  return res;
}
