import { ENV } from '../../../config/env.js';
const r = await fetch(`${ENV.apiUrl}/authenticate`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'qa-nosuchuser', password: 'qaX', rememberMe: false }),
});
const t = (await r.text()).replace(/\s+/g, ' ');
const i = t.indexOf('rejected value');
console.log(t.slice(i - 60, i + 160));
