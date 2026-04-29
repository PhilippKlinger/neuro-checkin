const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

// Writes assets/adi-registration.properties into the Android build.
// Snippet is read from ADI_SNIPPET env var — never hardcoded.
// Remove this plugin + EAS var after Google verifies package name ownership.
module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
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
  ]);
};
