import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('applies defaults', () => {
    const env = validateEnv({ OPENAI_API_KEY: 'sk-x' });
    expect(env).toMatchObject({
      PORT: 3000,
      OPENAI_CHAT_MODEL: 'gpt-4.1-mini',
      OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
      TOP_K: 5,
      MIN_SIMILARITY: 0.3,
      LOAD_DOCUMENTS_ON_STARTUP: true,
    });
  });

  it('coerces strings and booleans', () => {
    const env = validateEnv({ OPENAI_API_KEY: 'k', TOP_K: '7', LOAD_DOCUMENTS_ON_STARTUP: 'false' });
    expect(env.TOP_K).toBe(7);
    expect(env.LOAD_DOCUMENTS_ON_STARTUP).toBe(false);
  });

  it('fails fast on a missing key without echoing values', () => {
    expect(() => validateEnv({ MIN_SIMILARITY: '5' })).toThrow(/OPENAI_API_KEY.*\n.*MIN_SIMILARITY/s);
  });

  it('rejects overlap >= chunk size', () => {
    expect(() => validateEnv({ OPENAI_API_KEY: 'k', CHUNK_SIZE: '300', CHUNK_OVERLAP: '300' })).toThrow(/CHUNK_OVERLAP/);
  });
});
