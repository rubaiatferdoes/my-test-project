import { ENV } from '../../../config/env.js';
import { tenantOf } from '../../../config/env.js';
const call = async (username, password, label) => {
  const r = await fetch(`${ENV.apiUrl}/authenticate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe: false }),
  });
  const t = (await r.text()).replace(/\s+/g, ' ');
  console.log(`--- ${label}: ${r.status}`);
  console.log('    contains the password string? ' + t.includes(password));
  console.log('    body: ' + t.slice(0, 320));
};
await call('qa-nosuchuser', 'qaX1', 'unknown user, valid-length password');
await call('qa-nosuchuser', 'qaX', 'unknown user, 3-char password qaX');
await call(tenantOf('a').user, 'qa-wrong-password-2', 'REAL user, wrong password');
