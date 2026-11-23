'use strict';
// End-to-end tests against a local Microsoft Graph mock. No real Microsoft account needed.
const http = require('http');
const assert = require('assert');
const HDR = ['تاريخ ووقت الطلب','رقم الطلب','الحالة','اسم الشركة','اسم المسؤول','رقم الجوال','البريد الإلكتروني','المدينة','القطاع','حجم الأسطول أو الاحتياج','الخدمة المطلوبة','تفاصيل الطلب','اسم النموذج','رابط الصفحة','مصدر العميل','حالة المتابعة','المسؤول عن المتابعة','ملاحظات'];
// shuffle header order to prove mapping by name
const SHEET = { hdr: HDR.slice().reverse(), rows: [HDR.map(() => '')] };
let fail = null, tokens = 0, calls = [];
const mock = http.createServer((q, s) => {
  let b = ''; q.on('data', c => b += c); q.on('end', () => {
    const u = decodeURIComponent(q.url); calls.push(q.method + ' ' + u);
    const j = (c, o, h) => { s.writeHead(c, Object.assign({ 'content-type': 'application/json' }, h || {})); s.end(JSON.stringify(o)); };
    if (u.includes('/oauth2/v2.0/token')) { tokens++; return j(200, { access_token: 'tok' + tokens, expires_in: 3600 }); }
    if (fail && fail.n > 0 && q.method === fail.method) { fail.n--; return j(fail.code, { error: { code: 'x', message: 'mock' } }, fail.code === 429 ? { 'retry-after': '0' } : {}); }
    if (u.endsWith('/headerRowRange?$select=values')) return j(200, { values: [SHEET.hdr] });
    if (u.includes('/columns/رقم الطلب/dataBodyRange')) { const i = SHEET.hdr.indexOf('رقم الطلب'); return j(200, { values: SHEET.rows.map(r => [r[i]]) }); }
    if (u.includes('/rows/itemAt(index=0)') && q.method === 'GET') return j(200, { values: [SHEET.rows[0]] });
    if (u.includes('/rows/itemAt(index=0)') && q.method === 'PATCH') { SHEET.rows[0] = JSON.parse(b).values[0]; return j(200, { index: 0 }); }
    if (u.endsWith('/rows/add') && q.method === 'POST') { SHEET.rows.push(JSON.parse(b).values[0]); return j(201, { index: SHEET.rows.length - 1 }); }
    j(404, { error: { code: 'notFound', message: u } });
  });
});
const ORIGIN = 'https://fuelapp-website-preview.onrender.com';
(async () => {
  await new Promise(r => mock.listen(0, r));
  const base = 'http://127.0.0.1:' + mock.address().port;
  Object.assign(process.env, { MS_TENANT_ID: 't', MS_CLIENT_ID: 'c', MS_CLIENT_SECRET: 's', MS_DRIVE_ID: 'd', MS_ITEM_ID: 'i',
    GRAPH_BASE: base + '/v1.0', LOGIN_BASE: base, ALLOWED_ORIGINS: ORIGIN, RATE_LIMIT_MAX: '100' });
  const { server, saMobile, cell } = require('../server.js');
  await new Promise(r => server.listen(0, r));
  const api = 'http://127.0.0.1:' + server.address().port + '/api/leads';
  const post = (body, o) => fetch(api, { method: 'POST', headers: { 'content-type': 'application/json', origin: (o || ORIGIN) }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, j: await r.json(), h: r.headers }));
  const good = (x) => Object.assign({ company: 'شركة الاختبار', name: 'أحمد', mobile: '+966 50 123 4567', email: 'Ahmed@Company.com', city: 'الرياض', sector: 'المقاولات والمشاريع',
    volume: '30,000 لتر شهريًا', service: 'توريد الديزل', details: 'نحتاج توريدًا أسبوعيًا لموقع مشروع في شمال الرياض.', consent: true, form: 'اطلب عرضًا تشغيليًا',
    page: ORIGIN + '/#contact', source: 'google / cpc', elapsed: 9000 }, x || {});
  const col = n => SHEET.hdr.indexOf(n);
  let ok = 0; const t = async (name, fn) => { await fn(); ok++; console.log('✓', name); };

  await t('mobile normaliser', () => { assert.equal(saMobile('٠٥٠١٢٣٤٥٦٧'), '0501234567'); assert.equal(saMobile('00966501234567'), '0501234567'); assert.equal(saMobile('501234567'), '0501234567'); assert.equal(saMobile('0401234567'), null); assert.equal(saMobile('05012345'), null); });
  await t('formula injection is neutralised', () => { assert.equal(cell('=HYPERLINK("x")'), "'=HYPERLINK(\"x\")"); assert.equal(cell('@SUM'), "'@SUM"); assert.equal(cell('نص'), 'نص'); });
  await t('first lead fills the empty first table row, columns mapped by name', async () => {
    const r = await post(good()); assert.equal(r.status, 200, JSON.stringify(r.j)); assert.equal(r.j.id, `FA-${new Date().getFullYear()}-0001`);
    assert.equal(SHEET.rows.length, 1); const row = SHEET.rows[0];
    assert.equal(row[col('رقم الطلب')], "'" === row[col('رقم الطلب')][0] ? row[col('رقم الطلب')] : r.j.id);
    assert.equal(row[col('الحالة')], 'جديد'); assert.equal(row[col('رقم الجوال')], "'0501234567"); assert.equal(row[col('البريد الإلكتروني')], 'ahmed@company.com');
    assert.equal(row[col('اسم النموذج')], 'اطلب عرضًا تشغيليًا'); assert.equal(row[col('مصدر العميل')], 'google / cpc'); assert.equal(row[col('حالة المتابعة')], 'لم تبدأ');
    assert.match(row[col('تاريخ ووقت الطلب')], /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/); assert.equal(r.h.get('access-control-allow-origin'), ORIGIN);
  });
  await t('Riyadh time is used', () => { const { riyadhNow } = require('../server.js'); assert.equal(riyadhNow(new Date('2026-12-31T22:30:00Z')).text, '2027-01-01 01:30:00'); });
  await t('second lead appends a new row with the next number; duplicates kept', async () => {
    const r = await post(good()); assert.equal(r.j.id, `FA-${new Date().getFullYear()}-0002`); assert.equal(SHEET.rows.length, 2);
  });
  await t('8 concurrent submissions get 8 unique sequential numbers', async () => {
    const rs = await Promise.all(Array.from({ length: 8 }, () => post(good({ form: 'تواصل معنا' }))));
    const ids = rs.map(r => r.j.id); assert.equal(new Set(ids).size, 8); assert.equal(SHEET.rows.length, 10);
  });
  await t('validation errors return 422 with field names and nothing is written', async () => {
    const n = SHEET.rows.length; const r = await post(good({ mobile: '12345', email: 'bad@', details: '', consent: false }));
    assert.equal(r.status, 422); assert.deepEqual(Object.keys(r.j.fields).sort(), ['consent', 'details', 'email', 'mobile']); assert.equal(SHEET.rows.length, n);
  });
  await t('honeypot and too-fast submissions are dropped silently', async () => {
    const n = SHEET.rows.length; assert.equal((await post(good({ website: 'http://spam' }))).j.id, null); assert.equal((await post(good({ elapsed: 300 }))).j.id, null); assert.equal(SHEET.rows.length, n);
  });
  await t('foreign origin is refused', async () => { assert.equal((await post(good(), 'https://evil.example')).status, 403); });
  await t('Graph 429 / 503 are retried and the lead is still saved', async () => {
    const n = SHEET.rows.length; fail = { method: 'POST', code: 429, n: 2 }; const r = await post(good()); assert.equal(r.status, 200); assert.equal(SHEET.rows.length, n + 1);
  });
  await t('expired token (401) is refreshed once', async () => { const before = tokens; fail = { method: 'POST', code: 401, n: 1 }; const r = await post(good()); assert.equal(r.status, 200); assert.equal(tokens, before + 1); });
  await t('persistent Graph failure → 502 save_failed, no success shown, lead logged for recovery', async () => {
    const n = SHEET.rows.length; fail = { method: 'POST', code: 500, n: 10 };
    const orig = console.log; let logged = ''; console.log = s => { logged += s; };
    const r = await post(good()); console.log = orig; fail = null;
    assert.equal(r.status, 502); assert.equal(r.j.ok, false); assert.equal(r.j.code, 'save_failed'); assert.ok(r.j.ref); assert.equal(SHEET.rows.length, n);
    assert.ok(logged.includes('LEAD_NOT_SAVED') && logged.includes('شركة الاختبار'));
  });
  await t('missing table column is reported, not silently written', async () => {
    const saved = SHEET.hdr; SHEET.hdr = saved.filter(h => h !== 'ملاحظات'); const orig = console.log; console.log = () => { };
    const r = await post(good()); console.log = orig; SHEET.hdr = saved; assert.equal(r.status, 502);
  });
  await t('rate limit returns 429', async () => {
    process.env.RATE_LIMIT_MAX = '1'; delete require.cache[require.resolve('../server.js')];
    const s2 = require('../server.js').server; await new Promise(r => s2.listen(0, r)); const a2 = 'http://127.0.0.1:' + s2.address().port + '/api/leads';
    const p = () => fetch(a2, { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN }, body: JSON.stringify(good()) }).then(r => r.status);
    assert.equal(await p(), 200); assert.equal(await p(), 429); s2.close();
  });
  console.log(`\n${ok} tests passed. Rows in mock sheet: ${SHEET.rows.length}`);
  console.log('Last row:', JSON.stringify(Object.fromEntries(SHEET.hdr.map((h, i) => [h, SHEET.rows[SHEET.rows.length - 1][i]]))));
  server.close(); mock.close(); process.exit(0);
})().catch(e => { console.error('✗', e); process.exit(1); });
