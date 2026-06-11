/**
 * Preload that forces IPv4 DNS resolution for all Node connections.
 * Needed on DNS64/NAT64 networks where the synthesized IPv6 path blackholes
 * Node's fetch (curl/Chromium fall back to IPv4; undici does not).
 *
 * Usage: NODE_OPTIONS="--require <abs path>/force-ipv4.cjs" pnpm start
 * Local measurement aid only — not part of the application.
 */
const dns = require('node:dns');

const originalLookup = dns.lookup.bind(dns);
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof options === 'number') {
    options = { family: options };
  }
  return originalLookup(hostname, { ...options, family: 4 }, callback);
};
