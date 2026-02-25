const { registerProvider, getProvider, clearProviderCache } = require('../registry');

afterEach(() => {
  clearProviderCache();
});

describe('Provider Registry', () => {
  test('registers and retrieves a provider', () => {
    const mockProvider = { name: 'test-provider' };
    registerProvider('test', 'mock', () => mockProvider);
    process.env.TEST_PROVIDER = 'mock';
    const result = getProvider('test');
    expect(result).toBe(mockProvider);
    delete process.env.TEST_PROVIDER;
  });

  test('falls back to default provider when env not set', () => {
    const defaultProvider = { name: 'default-provider' };
    registerProvider('fallback', 'default', () => defaultProvider);
    delete process.env.FALLBACK_PROVIDER;
    const result = getProvider('fallback');
    expect(result).toBe(defaultProvider);
  });

  test('caches provider instances (factory called once)', () => {
    const factory = jest.fn(() => ({ name: 'cached' }));
    registerProvider('cached', 'default', factory);
    getProvider('cached');
    getProvider('cached');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('clearProviderCache forces re-creation', () => {
    const factory = jest.fn(() => ({ name: 'recache' }));
    registerProvider('recache', 'default', factory);
    getProvider('recache');
    clearProviderCache();
    getProvider('recache');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  test('throws when no providers registered for type', () => {
    expect(() => getProvider('nonexistent')).toThrow('No providers registered for type: nonexistent');
  });

  test('throws when named provider not found and no default', () => {
    registerProvider('partial', 'specific', () => ({}));
    process.env.PARTIAL_PROVIDER = 'missing';
    expect(() => getProvider('partial')).toThrow('Provider "missing" not found');
    delete process.env.PARTIAL_PROVIDER;
  });

  test('selects provider by env variable', () => {
    const providerA = { name: 'a' };
    const providerB = { name: 'b' };
    registerProvider('multi', 'alpha', () => providerA);
    registerProvider('multi', 'beta', () => providerB);
    process.env.MULTI_PROVIDER = 'beta';
    const result = getProvider('multi');
    expect(result).toBe(providerB);
    delete process.env.MULTI_PROVIDER;
  });
});
