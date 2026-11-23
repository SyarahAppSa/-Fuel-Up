'use strict';
// Usage (with all MS_* variables set): node tools/test-row.js
// Appends one clearly-marked test row to the Website_Leads table and prints its request number.
const { appendToExcel, CONFIGURED } = require('../server.js');
(async () => {
  if (!CONFIGURED) { console.error('Missing MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET / MS_DRIVE_ID / MS_ITEM_ID.'); process.exit(1); }
  const r = await appendToExcel({
    status: 'اختبار', company: 'اختبار الربط — فيول آب', name: 'صف اختبار', mobile: '0500000000', email: 'test@fuelapp.sa',
    city: 'الرياض', sector: 'اختبار', volume: '—', service: 'اختبار', details: 'صف اختبار للتأكد من ربط الموقع بملف Excel. يمكن حذفه.',
    form: 'تواصل معنا', page: 'https://fuelapp-website-preview.onrender.com/#contact', source: 'اختبار الربط', notes: 'صف اختبار — يمكن حذفه',
  });
  console.log('Test row saved:', r.id, r.at);
  process.exit(0);
})().catch(e => { console.error('Failed:', e.message, e.status || '', e.detail || ''); process.exit(1); });
