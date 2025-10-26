import { KeezApiConfig } from './keez/keezApi';

export type Env = {
  stripeApiKey: string;
  keez: KeezApiConfig;
};

export function parseEnv() {
  const env: Env = {
    stripeApiKey: process.env.STRIPE_API_KEY!,
    keez: {
      apiUrl: process.env.KEEZ_API_URL!,
      apiKey: process.env.KEEZ_API_KEY!,
      apiSecret: process.env.KEEZ_API_SECRET!,
      clientId: process.env.KEEZ_CLIENT_ID!,
    },
  };

  if (!env.stripeApiKey) {
    throw new Error('Missing STRIPE_API_KEY in environment variables');
  }
  if (!env.keez.apiUrl) {
    throw new Error('Missing KEEZ_API_URL in environment variables');
  }
  if (!env.keez.apiKey) {
    throw new Error('Missing KEEZ_API_KEY in environment variables');
  }
  if (!env.keez.apiSecret) {
    throw new Error('Missing KEEZ_API_SECRET in environment variables');
  }
  if (!env.keez.clientId) {
    throw new Error('Missing KEEZ_CLIENT_ID in environment variables');
  }

  return env;
}
