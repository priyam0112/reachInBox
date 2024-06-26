import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export async function getOutlookToken(clientId: string) {
  const client = Client.init({
    authProvider: (done) => done(null, process.env.OUTLOOK_CLIENT_SECRET!),
  });

  // Authenticate and get the access token
  const token = await client.api('/me').get();
  return token;
}
