export type Env = {
  appName: string;
  nodeEnv: 'development' | 'production';
  port: number;
};

export function parseEnv(): Env {
  return {
    appName: process.env.F2A_NODE_BACK_END_APP_NAME || 'node-backend',
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    port: process.env.F2A_NODE_BACK_END_PORT ? parseInt(process.env.F2A_NODE_BACK_END_PORT, 10) : 3000,
  };
}
