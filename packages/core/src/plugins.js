const path = require('path');
const fs = require('fs');

/**
 * Load plugins from the plugins directory.
 * Each plugin must export { name, router } at minimum.
 * Routes are mounted at /api/{plugin.name}
 */
function loadPlugins(app, pluginsDir) {
  if (!fs.existsSync(pluginsDir)) {
    console.log('[Plugins] No plugins directory found, skipping plugin loading');
    return [];
  }

  const loaded = [];
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginPath = path.join(pluginsDir, entry.name);
    try {
      const plugin = require(pluginPath);

      if (!plugin.name || !plugin.router) {
        console.warn(`[Plugins] Skipping ${entry.name}: missing 'name' or 'router' export`);
        continue;
      }

      app.use(`/api/${plugin.name}`, plugin.router);
      loaded.push(plugin.name);
      console.log(`[Plugins] Loaded: ${plugin.name} → /api/${plugin.name}`);
    } catch (error) {
      console.error(`[Plugins] Failed to load ${entry.name}:`, error.message);
    }
  }

  if (loaded.length > 0) {
    console.log(`[Plugins] ${loaded.length} plugin(s) loaded: ${loaded.join(', ')}`);
  } else {
    console.log('[Plugins] No plugins found');
  }

  return loaded;
}

module.exports = { loadPlugins };
