declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    NEON_DATABASE_URL?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  }
}
