// Vercel Serverless Function — relais transparent vers JSONbin Pro
// Permet aux clients qui ne peuvent pas atteindre api.jsonbin.io (iPhone, certains réseaux)
// de passer par dianalivraison.vercel.app/api/cloud (qui marche depuis n'importe où).

const JBIN = '69e7f319856a6821895b22f4';
const JKEY = '$2a$10$Bl5XcpoCn.nkMDLQ4hV37OE5XSCTH0aEEAmPhQCQC9iw421Z1TPjy';

export default async function handler(req, res) {
  // CORS — autorise n'importe quel client à appeler ce proxy
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Master-Key');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      // Pull : récupère le contenu actuel du bin
      const url = `https://api.jsonbin.io/v3/b/${JBIN}/latest?t=${Date.now()}`;
      const r = await fetch(url, {
        method: 'GET',
        headers: { 'X-Master-Key': JKEY }
      });
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(r.status).send(text);
    }

    if (req.method === 'PUT') {
      // Push : remplace le contenu du bin
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      // Garde-fou minimal serveur-side : refuse de push si orders manquant ou vide alors que le cloud actuel a >= 10
      if (body && Array.isArray(body.orders) && body.orders.length === 0) {
        // Check current cloud state
        try {
          const cur = await fetch(`https://api.jsonbin.io/v3/b/${JBIN}/latest?t=${Date.now()}`, {
            headers: { 'X-Master-Key': JKEY }
          });
          if (cur.ok) {
            const curData = await cur.json();
            const curOrders = (curData && curData.record && curData.record.orders) || [];
            if (curOrders.length >= 10) {
              return res.status(409).json({
                error: 'BLOCKED_EMPTY_PUSH',
                message: 'Refuse de push 0 commandes alors que le cloud a ' + curOrders.length,
                cloudCount: curOrders.length
              });
            }
          }
        } catch(e) {}
      }

      const url = `https://api.jsonbin.io/v3/b/${JBIN}`;
      const r = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JKEY
        },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(r.status).send(text);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'proxy_error', message: String(e && e.message || e) });
  }
}
