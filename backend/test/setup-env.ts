import * as path from 'path';

// ConfigModule validates env when AppModule is imported, so this must run before any test file loads.
Object.assign(process.env, {
  NODE_ENV: 'test',
  OPENAI_API_KEY: 'sk-test-not-a-real-key',
  SOURCE_DIR: path.join(__dirname, 'fixtures', 'kb'),
  LOAD_DOCUMENTS_ON_STARTUP: 'false',
  MIN_SIMILARITY: '0.2',
  TOP_K: '3',
  CHAT_RATE_LIMIT_PER_MIN: '1000',
});
