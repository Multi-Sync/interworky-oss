const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadPlugins } = require('../plugins');

describe('Plugin Loader', () => {
  let app;
  let tmpDir;

  beforeEach(() => {
    app = express();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'interworky-plugin-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns empty array when plugins directory does not exist', () => {
    const result = loadPlugins(app, '/nonexistent/path');
    expect(result).toEqual([]);
  });

  test('returns empty array when plugins directory is empty', () => {
    const result = loadPlugins(app, tmpDir);
    expect(result).toEqual([]);
  });

  test('loads a valid plugin and mounts its router', () => {
    const pluginDir = path.join(tmpDir, 'test-plugin');
    fs.mkdirSync(pluginDir);
    // Use require.resolve to get the absolute path to express so the temp
    // plugin can find it regardless of its location on disk.
    const expressPath = require.resolve('express');
    fs.writeFileSync(
      path.join(pluginDir, 'index.js'),
      `const express = require(${JSON.stringify(expressPath)});
       const router = express.Router();
       router.get('/hello', (_req, res) => res.json({ ok: true }));
       module.exports = { name: 'test-plugin', router };`,
    );
    const result = loadPlugins(app, tmpDir);
    expect(result).toEqual(['test-plugin']);
  });

  test('skips plugin missing name export', () => {
    const pluginDir = path.join(tmpDir, 'bad-plugin');
    fs.mkdirSync(pluginDir);
    fs.writeFileSync(
      path.join(pluginDir, 'index.js'),
      `module.exports = { router: {} };`,
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = loadPlugins(app, tmpDir);
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing'));
    warnSpy.mockRestore();
  });

  test('skips plugin missing router export', () => {
    const pluginDir = path.join(tmpDir, 'no-router');
    fs.mkdirSync(pluginDir);
    fs.writeFileSync(
      path.join(pluginDir, 'index.js'),
      `module.exports = { name: 'no-router' };`,
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = loadPlugins(app, tmpDir);
    expect(result).toEqual([]);
    warnSpy.mockRestore();
  });

  test('handles plugin that throws on require', () => {
    const pluginDir = path.join(tmpDir, 'crash-plugin');
    fs.mkdirSync(pluginDir);
    fs.writeFileSync(
      path.join(pluginDir, 'index.js'),
      `throw new Error('plugin init failed');`,
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = loadPlugins(app, tmpDir);
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load'),
      'plugin init failed',
    );
    errorSpy.mockRestore();
  });
});
