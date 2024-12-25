export const ENV = {
  nodeEnv: process.env.NEXT_PUBLIC_NODE_ENV ?? "development",
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_KEY,
  },
  webappUrl: process.env.NEXT_PUBLIC_WEBAPP_URL ?? "http://localhost:3001/",
  mezmoApiKey: process.env.NEXT_PUBLIC_MEZMO_API_KEY,
  amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
};
