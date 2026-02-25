const { clearProviderCache } = require('../registry');

// Set env defaults before loading providers
process.env.AI_API_KEY = 'test-key';
process.env.AI_BASE_URL = 'https://test.example.com/v1';
process.env.STORAGE_LOCAL_PATH = '/tmp/interworky-test-storage';

afterEach(() => {
  clearProviderCache();
});

afterAll(() => {
  const fs = require('fs');
  if (fs.existsSync('/tmp/interworky-test-storage')) {
    fs.rmSync('/tmp/interworky-test-storage', { recursive: true, force: true });
  }
});

describe('Provider defaults resolve without errors', () => {
  test('email provider resolves to ConsoleEmailProvider', () => {
    delete process.env.EMAIL_PROVIDER;
    const { getEmailProvider } = require('../index');
    const provider = getEmailProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.send).toBe('function');
    expect(typeof provider.sendTemplate).toBe('function');
  });

  test('SMS provider resolves to ConsoleSMSProvider', () => {
    delete process.env.SMS_PROVIDER;
    const { getSMSProvider } = require('../index');
    const provider = getSMSProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.send).toBe('function');
  });

  test('storage provider resolves to LocalStorageProvider', () => {
    delete process.env.STORAGE_PROVIDER;
    const { getStorageProvider } = require('../index');
    const provider = getStorageProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.upload).toBe('function');
    expect(typeof provider.download).toBe('function');
    expect(typeof provider.delete).toBe('function');
    expect(typeof provider.list).toBe('function');
  });

  test('AI provider resolves to OpenAIProvider', () => {
    delete process.env.AI_PROVIDER;
    const { getAIProvider } = require('../index');
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.stream).toBe('function');
    expect(typeof provider.getClient).toBe('function');
  });

  test('console email provider logs without crashing', async () => {
    delete process.env.EMAIL_PROVIDER;
    const { getEmailProvider } = require('../index');
    const provider = getEmailProvider();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await provider.send('test@example.com', 'Test Subject', '<p>Hello</p>');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('console SMS provider logs without crashing', async () => {
    delete process.env.SMS_PROVIDER;
    const { getSMSProvider } = require('../index');
    const provider = getSMSProvider();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await provider.send('+15551234567', 'Test message');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('local storage provider can upload and read a file', async () => {
    delete process.env.STORAGE_PROVIDER;
    const { getStorageProvider } = require('../index');
    const provider = getStorageProvider();
    const content = Buffer.from('test content');
    await provider.upload(content, 'test/file.txt');
    const downloaded = await provider.download('test/file.txt');
    expect(downloaded.toString()).toBe('test content');
    await provider.delete('test/file.txt');
  });
});
