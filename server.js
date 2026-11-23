'use strict';
/*
 * Fuel App website leads API
 * Receives the website form and appends one row to an Excel Online table
 * (OneDrive / SharePoint) through Microsoft Graph, app-only auth.
 * No external dependencies. All secrets come from environment variables.
 */
const http = require('http');
const crypto = require('crypto');

const env = process.env;
const CFG = {
  port: Number(env.PORT || 10000),
  tenant: env.MS_TENANT_ID || '',
  clientId: env.MS_CLIENT_ID || '',
  clientSecret: env.MS_CLIENT_SECRET || '',
  driveId: env.MS_DRIVE_ID || '',
  itemId: env.MS_ITEM_ID || '',
  table: env.MS_TABLE_NAME || 'Website_Leads',
  prefix: env.LEAD_ID_PREFIX || 'FA',
  demo: env.DEMO_MODE === '1',
  origins: (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  graphBase: env.GRAPH_BASE || 'https://graph.microsoft.com/v1.0',
  loginBase: env.LOGIN_BASE || 'https://login.microsoftonline.com',
  rateMax: Number(env.RATE_LIMIT_MAX || 5),
  rateWindowMs: Number(env.RATE_LIMIT_WINDOW_MIN || 10) * 60000,
  minFillMs: Number(env.MIN_FILL_MS || 2500),
};
const CONFIGURED = !!(CFG.tenant && CFG.clientId && CFG.clientSecret && CFG.driveId && CFG.itemId);
const MODE = CONFIGURED ? 'excel' : (CFG.demo ? 'demo' : 'off');

/* Excel column headers (must exist in the table; order in Excel can differ) */
const COL = {
  at: 'تاريخ ووقت الطلب', id: 'رقم الطلب', status: 'الحالة', company: 'اسم الشركة',
  name: 'اسم المسؤول', mobile: 'رقم الجوال', email: 'البريد الإلكتروني', city: 'المدينة',
  sector: 'القطاع', volume: 'حجم الأسطول أو الاحتياج', service: 'الخدمة المطلوبة',
  details: 'تفاصيل الطلب', form: 'اسم النموذج', page: 'رابط الصفحة', source: 'مصدر العميل',
  follow: 'حالة المتابعة', owner: 'المسؤول عن المتابعة', notes: 'ملاحظات',
};
const FORMS = ['تواصل معنا', 'اطلب عرضًا تشغيليًا'];

/* ---------------- helpers ---------------- */
const log = (level, msg, extra) => console.log(JSON.stringify(Object.assign({ t: new Date().toISOString(), level, msg }, extra || {})));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function riyadhNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map(x => [x.type, x.value]));
  return { text: `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`, year: p.year };
}

/* Stop Excel from treating user text as a formula or number (keeps 05… leading zero) */
function cell(v) {
  v = String(v == null ? '' : v);
  return /^[=+\-@\t\r0-9]/.test(v) ? "'" + v : v;
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function cleanBlock(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

/* Saudi mobile → 05XXXXXXXX ; accepts +966 / 00966 / 966 / 05 / 5, Arabic-Indic digits */
function saMobile(v) {
  let d = String(v || '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c));
  d = d.replace(/[\s\-().]/g, '').replace(/^(\+966|00966|966)/, '0');
  if (/^5\d{8}$/.test(d)) d = '0' + d;
  return /^05\d{8}$/.test(d) ? d : null;
}
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

function validate(b) {
  const errors = {};
  const out = {
    company: clean(b.company, 150), name: clean(b.name, 120), email: clean(b.email, 160).toLowerCase(),
    city: clean(b.city, 80), sector: clean(b.sector, 100), volume: clean(b.volume, 200),
    service: clean(b.service, 120), details: cleanBlock(b.details, 3000),
  };
  for (const k of Object.keys(out)) if (!out[k]) errors[k] = 'required';
  if (out.details && out.details.length < 10) errors.details = 'too_short';
  const m = saMobile(b.mobile);
  if (!m) errors.mobile = 'invalid'; else out.mobile = m;
  if (out.email && (!EMAIL_RE.test(out.email) || out.email.length > 160)) errors.email = 'invalid';
  if (b.consent !== true) errors.consent = 'required';
  out.form = FORMS.includes(b.form) ? b.form : FORMS[0];
  let page = clean(b.page, 500);
  try { const u = new URL(page); if (!/^https?:$/.test(u.protocol)) page = ''; } catch (_) { page = ''; }
  out.page = page;
  out.source = clean(b.source, 200) || 'مباشر';
  return { ok: Object.keys(errors).length === 0, errors, lead: out };
}

/* ---------------- rate limit (per IP, in memory) ---------------- */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < CFG.rateWindowMs);
  if (arr.length >= CFG.rateMax) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < CFG.rateWindowMs)) hits.delete(k); }, 60000).unref();

/* ---------------- Microsoft Graph ---------------- */
let tok = null;
async function token(force) {
  if (!force && tok && tok.exp > Date.now() + 60000) return tok.v;
  const r = await fetch(`${CFG.loginBase}/${encodeURIComponent(CFG.tenant)}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CFG.clientId, client_secret: CFG.clientSecret, grant_type: 'client_credentials', scope: 'https://graph.microsoft.com/.default' }),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw Object.assign(new Error('token_failed'), { status: r.status, detail: j.error || '' });
  tok = { v: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return tok.v;
}

const WB = () => `${CFG.graphBase}/drives/${encodeURIComponent(CFG.driveId)}/items/${encodeURIComponent(CFG.itemId)}/workbook`;
const TB = () => `${WB()}/tables/${encodeURIComponent(CFG.table)}`;

async function graph(method, url, body) {
  let authRetry = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    let r;
    try {
      r = await fetch(url, {
        method, headers: { authorization: 'Bearer ' + await token(authRetry), 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
      });
    } catch (e) {
      if (attempt === 3) throw Object.assign(new Error('graph_network'), { detail: e.message });
      await sleep(500 * 2 ** attempt); continue;
    }
    if (r.status === 401 && !authRetry) { authRetry = true; attempt--; continue; }
    if ((r.status === 429 || r.status >= 500) && attempt < 3) {
      const ra = Number(r.headers.get('retry-after'));
      await sleep(Math.min(ra > 0 ? ra * 1000 : 700 * 2 ** attempt, 8000)); continue;
    }
    const txt = await r.text();
    let j = {}; try { j = txt ? JSON.parse(txt) : {}; } catch (_) { }
    if (!r.ok) throw Object.assign(new Error('graph_error'), { status: r.status, detail: (j.error && (j.error.code + ': ' + j.error.message)) || txt.slice(0, 300) });
    return j;
  }
}

let headerCache = null;
async function headers() {
  if (headerCache && headerCache.exp > Date.now()) return headerCache.v;
  const j = await graph('GET', `${TB()}/headerRowRange?$select=values`);
  const v = (j.values && j.values[0] || []).map(s => String(s).trim());
  const missing = Object.values(COL).filter(c => !v.includes(c));
  if (missing.length) throw Object.assign(new Error('table_columns_missing'), { detail: missing.join(' | ') });
  headerCache = { v, exp: Date.now() + 10 * 60000 };
  return v;
}

/* Reads the request-number column; returns next number for this year and whether the only row is empty */
async function nextId(year) {
  const j = await graph('GET', `${TB()}/columns/${encodeURIComponent(COL.id)}/dataBodyRange?$select=values`);
  const vals = (j.values || []).map(r => String(r[0] || '').replace(/^'/, '').trim());
  const re = new RegExp(`^${CFG.prefix}-${year}-(\\d+)$`);
  let max = 0;
  for (const v of vals) { const m = re.exec(v); if (m) max = Math.max(max, Number(m[1])); }
  return { id: `${CFG.prefix}-${year}-${String(max + 1).padStart(4, '0')}`, rowCount: vals.length, firstEmpty: vals.length === 1 && vals[0] === '' };
}

async function firstRowBlank(hdr) {
  const j = await graph('GET', `${TB()}/rows/itemAt(index=0)?$select=values`);
  const row = (j.values && j.values[0]) || [];
  return row.length === hdr.length && row.every(c => String(c).trim() === '');
}

/* serialize writes so two requests never get the same number */
let chain = Promise.resolve();
function locked(fn) { const p = chain.then(fn, fn); chain = p.catch(() => { }); return p; }

async function appendToExcel(lead) {
  return locked(async () => {
    const hdr = await headers();
    const now = riyadhNow();
    const n = await nextId(now.year);
    const data = {
      [COL.at]: now.text, [COL.id]: n.id, [COL.status]: lead.status || 'جديد', [COL.company]: lead.company,
      [COL.name]: lead.name, [COL.mobile]: lead.mobile, [COL.email]: lead.email, [COL.city]: lead.city,
      [COL.sector]: lead.sector, [COL.volume]: lead.volume, [COL.service]: lead.service,
      [COL.details]: lead.details, [COL.form]: lead.form, [COL.page]: lead.page, [COL.source]: lead.source,
      [COL.follow]: lead.follow || 'لم تبدأ', [COL.owner]: '', [COL.notes]: lead.notes || '',
    };
    const row = hdr.map(h => h === COL.at ? data[h] : cell(data[h] != null ? data[h] : ''));
    if (n.firstEmpty && await firstRowBlank(hdr)) {
      await graph('PATCH', `${TB()}/rows/itemAt(index=0)`, { values: [row] });
    } else {
      const res = await graph('POST', `${TB()}/rows/add`, { index: null, values: [row] });
      if (!res || res.index == null) throw Object.assign(new Error('append_unconfirmed'), { detail: JSON.stringify(res).slice(0, 200) });
    }
    return { id: n.id, at: now.text };
  });
}

/* ---------------- HTTP ---------------- */
function corsHeaders(req) {
  const o = req.headers.origin;
  if (o && CFG.origins.includes(o)) return { 'access-control-allow-origin': o, vary: 'Origin', 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' };
  return { vary: 'Origin' };
}
function send(res, req, code, obj) {
  res.writeHead(code, Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, corsHeaders(req)));
  res.end(JSON.stringify(obj));
}
function readBody(req, limit = 16384) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too_large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

let demoSeq = 0;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders(req)); return res.end(); }
  if (req.method === 'GET' && (url.pathname === '/api/health' || url.pathname === '/')) return send(res, req, 200, { ok: true, mode: MODE });
  if (url.pathname !== '/api/leads') return send(res, req, 404, { ok: false, code: 'not_found' });
  if (req.method !== 'POST') return send(res, req, 405, { ok: false, code: 'method' });

  if (CFG.origins.length && !(origin && CFG.origins.includes(origin))) return send(res, req, 403, { ok: false, code: 'origin' });
  if (!/^application\/json/i.test(req.headers['content-type'] || '')) return send(res, req, 415, { ok: false, code: 'content_type' });

  let body;
  try { body = JSON.parse(await readBody(req)); } catch (e) { return send(res, req, e.code === 413 ? 413 : 400, { ok: false, code: 'bad_body' }); }
  if (!body || typeof body !== 'object') return send(res, req, 400, { ok: false, code: 'bad_body' });

  const reqId = crypto.randomUUID();
  /* spam: honeypot + too-fast submission → accept silently, store nothing */
  if (body.website || (Number(body.elapsed) >= 0 && Number(body.elapsed) < CFG.minFillMs)) {
    log('warn', 'spam_dropped', { reqId, ip, reason: body.website ? 'honeypot' : 'too_fast' });
    return send(res, req, 200, { ok: true, id: null, mode: MODE });
  }
  if (limited(ip)) { log('warn', 'rate_limited', { reqId, ip }); return send(res, req, 429, { ok: false, code: 'rate_limited' }); }

  const v = validate(body);
  if (!v.ok) return send(res, req, 422, { ok: false, code: 'invalid', fields: v.errors });

  if (MODE === 'off') {
    log('error', 'LEAD_NOT_SAVED', { reqId, reason: 'not_configured', lead: v.lead });
    return send(res, req, 503, { ok: false, code: 'not_configured', ref: reqId.slice(0, 8) });
  }
  if (MODE === 'demo') {
    const now = riyadhNow();
    const id = `${CFG.prefix}-${now.year}-${String(++demoSeq).padStart(4, '0')}`;
    log('info', 'demo_lead', { reqId, id, form: v.lead.form });
    return send(res, req, 200, { ok: true, id, mode: 'demo' });
  }
  try {
    const r = await appendToExcel(v.lead);
    log('info', 'lead_saved', { reqId, id: r.id, form: v.lead.form });
    return send(res, req, 200, { ok: true, id: r.id, mode: 'excel' });
  } catch (e) {
    headerCache = null;
    /* never lose a lead silently: full record goes to the service log for manual recovery */
    log('error', 'LEAD_NOT_SAVED', { reqId, reason: e.message, status: e.status, detail: e.detail, lead: v.lead });
    return send(res, req, 502, { ok: false, code: 'save_failed', ref: reqId.slice(0, 8) });
  }
});

if (require.main === module) server.listen(CFG.port, () => log('info', 'listening', { port: CFG.port, mode: MODE, table: CFG.table }));
module.exports = { server, saMobile, cell, validate, riyadhNow, MODE, appendToExcel, graph, CFG, CONFIGURED };
