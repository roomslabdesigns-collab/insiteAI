/**
 * Server Configuration & Environment Variable Management
 * Strictly server-side: never import in client code.
 */
import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  geminiApiKey: string | null;
  appUrl: string | null;
  database: {
    url: string | null;
    host: string | null;
    port: number;
    name: string | null;
    user: string | null;
    password?: string | null;
    ssl: boolean;
  };
}

export const config: ServerConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || null,
  appUrl: process.env.APP_URL || null,
  database: {
    url: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || null,
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'insightai',
    user: process.env.DB_USER || null,
    password: process.env.DB_PASSWORD || null,
    ssl: process.env.DB_SSL === 'true',
  },
};

/**
 * Lazy helper to safely retrieve the LLM API key when needed.
 * Fails gracefully if the key is missing without crashing server bootstrap.
 */
export function getGeminiApiKey(): string {
  const key = config.geminiApiKey;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is required for AI capabilities.');
  }
  return key;
}
