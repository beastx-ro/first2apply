export const ENV = {
  nodeEnv: process.env.NODE_ENV,
  appBundleId: process.env.APP_BUNDLE_ID,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  mezmoApiKey: process.env.MEZMO_API_KEY,
  amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
};
