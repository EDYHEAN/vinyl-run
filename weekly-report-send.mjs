// Envoie le mail du rapport hebdo (reports/<YYYY-MM-DD>.html, écrit par la routine du lundi à partir de
// reports/mail-template.html) à Johan et à la boutique (destinataires fixes, REPORT_TO dans api/notify.js).
// Passe par POST /api/notify { action: "report" } : la clé Brevo reste sur Vercel. Le <title> = l'objet du mail.
// Refuse d'envoyer un fichier où il reste un champ {{…}} non rempli.
// Lancé par .github/workflows/weekly-report.yml (secret NOTIFY_SECRET).
// Usage : node weekly-report-send.mjs [reports/<date>.html]   (défaut : le plus récent)
import fs from 'node:fs';

const SITE = 'https://www.vinyl-run.com';
const file = process.argv[2] || 'reports/' + fs.readdirSync('reports').filter((f) => /^\d{4}-\d{2}-\d{2}\.html$/.test(f)).sort().at(-1);
if (!fs.existsSync(file)) throw new Error('aucun rapport à envoyer');

const html = fs.readFileSync(file, 'utf8');
const blanks = html.replace(/<!--[\s\S]*?-->/g, '').match(/\{\{[^}]*\}\}|\{%|\{\{/g);
if (blanks) throw new Error(`${file} contient encore des accolades doubles : ${[...new Set(blanks)].join(', ')}`);

// sonde : une version d'api/notify.js sans l'action report enverrait ce HTML comme newsletter à toute la liste
const probe = await fetch(`${SITE}/api/notify`).then((r) => r.json()).catch(() => ({}));
if (!probe.actions?.includes('report')) throw new Error("api/notify.js déployé sans l'action report : envoi annulé");

const r = await fetch(`${SITE}/api/notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: process.env.NOTIFY_SECRET, action: 'report', html }),
});
const j = await r.json().catch(() => ({}));
if (!r.ok) throw new Error(`envoi refusé (${r.status}) : ${j.error ?? ''}`);
console.log(`envoyé ${file} à ${j.to} adresses : ${j.subject}`);
