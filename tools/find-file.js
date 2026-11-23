'use strict';
// Usage: MS_TENANT_ID=… MS_CLIENT_ID=… MS_CLIENT_SECRET=… node tools/find-file.js "<Excel sharing link>"
// Prints MS_DRIVE_ID and MS_ITEM_ID for the workbook, and checks the Website_Leads table.
process.env.MS_DRIVE_ID = process.env.MS_DRIVE_ID || 'x'; process.env.MS_ITEM_ID = process.env.MS_ITEM_ID || 'x';
const { graph, CFG } = require('../server.js');
(async () => {
  const link = process.argv[2];
  if (!link) { console.error('Pass the Excel sharing link as the first argument.'); process.exit(1); }
  const enc = 'u!' + Buffer.from(link).toString('base64').replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
  const it = await graph('GET', `${CFG.graphBase}/shares/${enc}/driveItem?$select=id,name,parentReference`);
  console.log('File:', it.name);
  console.log('MS_DRIVE_ID=' + it.parentReference.driveId);
  console.log('MS_ITEM_ID=' + it.id);
  const t = await graph('GET', `${CFG.graphBase}/drives/${it.parentReference.driveId}/items/${it.id}/workbook/tables?$select=name`);
  const names = (t.value || []).map(x => x.name);
  console.log('Tables:', names.join(', ') || '(none)');
  if (!names.includes(CFG.table)) console.log(`Warning: table "${CFG.table}" not found in this workbook.`);
  process.exit(0);
})().catch(e => { console.error('Failed:', e.message, e.status || '', e.detail || ''); process.exit(1); });
