'use strict';

const REPO = 'andrewlin9697/nsysu-hud';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;
const PAGES_BASE = 'https://andrewlin9697.github.io/nsysu-hud';

module.exports = {
  REPO,
  RAW_BASE,
  PAGES_BASE,
  BUNDLE_URL: `${RAW_BASE}/dist/NSYSU-HUD.js`,
  REPO_URL: `https://github.com/${REPO}`,
  CONFIG_NAMES: ['courses', 'semester', 'location', 'watchlist', 'macro-events', 'youbike'],
  CONFIG_TTL_MIN: 6 * 60,
};
