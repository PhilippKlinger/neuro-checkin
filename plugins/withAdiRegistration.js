const fs = require('fs');
const path = require('path');

// Writes assets/adi-registration.properties into the Android build.
// The snippet value is read from the ADI_SNIPPET environment variable —
// never hardcoded here. Set it via `eas env:create` before building.
// Remove this plugin after package name ownership is verified.
module.exports = function withAdiRegistration(config) {
  try {
    const { withDangerousMods } = require('@expo/config-plugins');
    if (typeof withDangerousMods !== 'function') {
      // Not in a build context (e.g. `eas env:create` reads the config).
      // Return config unchanged — the mod runs only during expo prebuild.
      return config;
    }
    return withDangerousMods(config, [
      [
        'android',
        async (cfg) => {
          const snippet = process.env.ADI_SNIPPET;
          if (!snippet) {
            console.warn('[withAdiRegistration] ADI_SNIPPET not set — skipping.');
            return cfg;
          }
          const assetsDir = path.join(
            cfg.modRequest.platformProjectRoot,
            'app', 'src', 'main', 'assets'
          );
          fs.mkdirSync(assetsDir, { recursive: true });
          fs.writeFileSync(path.join(assetsDir, 'adi-registration.properties'), snippet);
          console.log('[withAdiRegistration] adi-registration.properties written.');
          return cfg;
        },
      ],
    ]);
  } catch {
    // Graceful fallback if config-plugins is unavailable in this context.
    return config;
  }
};
