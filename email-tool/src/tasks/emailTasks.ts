// src/tasks/emailTasks.ts
import { Queue, Worker } from 'bullmq';
import logger from '../logger';
import { fetchEmailsGoogle, fetchEmailsOutlook, sendEmailGoogle, sendEmailOutlook } from '../services/emailService';
import { analyzeEmail, generateResponse } from '../services/openaiService';
import { getGoogleToken } from '../auth/google';
import { getOutlookToken } from '../auth/outlook';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';

export const emailQueue = new Queue('emailQueue', {
  connection: {
    host: '127.0.0.1',
    port: 6379
  }
});

const worker = new Worker('emailQueue', async job => {
  logger.info(`Processing job ${job.id} of type ${job.name}`);
  if (job.name === 'fetchAndCategorize') {
    try {
      // Fetch and categorize emails for Google
      const googleAuth = await getGoogleToken(process.env.YOUR_GOOGLE_AUTH_CODE!);
      const googleEmails = await fetchEmailsGoogle(googleAuth);
      for (const email of googleEmails) {
        const content = await getEmailContent(googleAuth, email.id!);
        const { from, subject } = getEmailHeaders(content);
        if (!from || !subject) continue; // Skip if headers are missing

        const category = await analyzeEmail(content.snippet  || ' ' );
        let response = '';
        switch (category) {
          case 'Interested':
            response = await generateResponse('Generate a response for an interested email');
            break;
          case 'Not Interested':
            response = await generateResponse('Generate a response for a not interested email');
            break;
          case 'More Information':
            response = await generateResponse('Generate a response for an email asking for more information');
            break;
        }
        await sendEmailGoogle(googleAuth, from, 'Re: ' + subject, response);
        logger.info(`Processed email from ${from} with subject ${subject}`);
      }

      // Fetch and categorize emails for Outlook
      const outlookToken = await getOutlookToken(process.env.YOUR_OUTLOOK_AUTH_CODE!);
      const outlookEmails = await fetchEmailsOutlook(outlookToken);
      for (const email of outlookEmails) {
        const content = await getEmailContentOutlook(outlookToken, email.id!);
        const { from, subject } = getEmailHeadersOutlook(email);
        if (!from || !subject) continue; // Skip if headers are missing

        const category = await analyzeEmail(content);
        let response = '';
        switch (category) {
          case 'Interested':
            response = await generateResponse('Generate a response for an interested email');
            break;
          case 'Not Interested':
            response = await generateResponse('Generate a response for a not interested email');
            break;
          case 'More Information':
            response = await generateResponse('Generate a response for an email asking for more information');
            break;
        }
        await sendEmailOutlook(outlookToken, from, 'Re: ' + subject, response);
        logger.info(`Processed email from ${from} with subject ${subject}`);
      }
    } catch (error) {
      logger.error(`Error processing job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}, {
  connection: {
    host: '127.0.0.1',
    port: 6379
  }
});

async function getEmailContent(auth: any, messageId: string) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({ userId: 'me', id: messageId });
  return res.data;
}

function getEmailHeaders(message: any) {
  const headers = message.payload.headers;
  const fromHeader = headers.find((header: any) => header.name === 'From');
  const subjectHeader = headers.find((header: any) => header.name === 'Subject');
  return {
    from: fromHeader ? fromHeader.value : null,
    subject: subjectHeader ? subjectHeader.value : null,
  };
}

async function getEmailContentOutlook(token: string, messageId: string) {
  const client = Client.init({
    authProvider: (done) => done(null, token),
  });

  const message = await client.api(`/me/messages/${messageId}`).get();
  return message.body.content;
}

function getEmailHeadersOutlook(message: any) {
  return {
    from: message.from?.emailAddress?.address || null,
    subject: message.subject || null,
  };
}
