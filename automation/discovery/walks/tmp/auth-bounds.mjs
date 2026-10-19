import { ENV } from '../../../config/env.js';
const call = async (username, password, label) => {
  const r = await fetch(`${ENV.apiUrl}/authenticate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe: false }),
  });
  const t = (await r.text()).replace(/\s+/g, ' ');
  let fe = '';
  try { const j = JSON.parse(t); fe = JSON.stringify(j.fieldErrors ?? j.detail ?? ''); } catch { fe = t.slice(0, 120); }
  const echoed = /qa-shortpw|qa-echo-probe/.test(t);
  console.log(`${label.padEnd(34)} ${r.status}  echoedPassword=${echoed}  ${fe.slice(0, 190)}`);
};
await call('q'.repeat(254), 'qa-wrong-password', 'username 254 chars');
await call('q'.repeat(255), 'qa-wrong-password', 'username 255 chars');
await call('q', 'qa-wrong-password', 'username 1 char');
await call('qa-nosuchuser', 'qa1', 'password 3 chars');
await call('qa-nosuchuser', 'qa12', 'password 4 chars');
await call('qa-nosuchuser', 'p'.repeat(100), 'password 100 chars');
await call('qa-nosuchuser', 'p'.repeat(101), 'password 101 chars');
await call('qa-nosuchuser', 'qa-echo-probe-short', 'password echo check (valid len)');
await call('qa-nosuchuser', 'qa-', 'password "qa-" (3, echo check)');
