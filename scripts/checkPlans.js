const fs = require('fs');
(async function () {
  const env = fs.readFileSync('.env.local', 'utf8');
  const m = {};
  env.split(/\r?\n/).forEach(l => {
    if (l && !l.startsWith('#')) {
      const i = l.indexOf('=');
      if (i > 0) {
        const k = l.slice(0, i);
        let v = l.slice(i + 1);
        v = v.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        m[k] = v;
      }
    }
  });
  const url = m.SUPABASE_URL;
  const key = m.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  try {
    const res = await fetch(url + '/rest/v1/pricing_plans?select=*', {
      headers: { apikey: key, Authorization: 'Bearer ' + key },
    });
    console.log('STATUS', res.status);
    const body = await res.text();
    console.log(body);
  } catch (e) {
    console.error('Fetch error', e);
  }
})();
