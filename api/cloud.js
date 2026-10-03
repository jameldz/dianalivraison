// Vercel Edge Function — Upstash Redis backend (remplace jsonbin)
// jsonbin quota épuisé le 28/05/2026 → migration vers Upstash KV (free 500K cmds/mois)
// Les env vars KV_REST_API_URL et KV_REST_API_TOKEN sont auto-injectées par Vercel.

export const config = { runtime: 'edge' };

const KEY = 'diana_data';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Master-Key',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout_' + ms + 'ms')), ms))
  ]);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return new Response(JSON.stringify({
      error: 'KV_NOT_CONFIGURED',
      message: 'KV_REST_API_URL ou KV_REST_API_TOKEN manquant dans les env vars Vercel'
    }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      // ═══ ?v=1 : « version » du cloud = valeur lastSync lue à la FIN de la donnée (GETRANGE, ~quelques octets) ═══
      // Permet au dashboard de ne télécharger les 1,7 Mo que s'il y a eu un changement.
      if (url.searchParams.get('v') === '1') {
        const rv = await withTimeout(fetch(`${KV_URL}/getrange/${KEY}/-48/-1`, {
          headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
        }), 8000);
        const dv = await rv.json().catch(() => null);
        if (!rv.ok || !dv || dv.error) {
          return new Response(JSON.stringify({ error: 'upstash_unavailable', status: rv.status, message: (dv && dv.error) || 'réponse Upstash invalide' }), {
            status: 503, headers: { ...CORS, 'Content-Type': 'application/json' }
          });
        }
        const m = (typeof dv.result === 'string') ? dv.result.match(/"lastSync":(\d+)\}\s*$/) : null;
        return new Response(JSON.stringify({ v: m ? Number(m[1]) : null }), {
          status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      const r = await withTimeout(fetch(`${KV_URL}/get/${KEY}`, {
        headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
      }), 15000);
      const data = await r.json().catch(() => null);
      // ═══ Upstash en erreur (quota, panne…) → on le DIT (503) au lieu de renvoyer un faux « cloud vide » ═══
      // (un faux cloud vide pousserait le lien de commande à réécrire le cloud avec une seule commande)
      if (!r.ok || !data || data.error) {
        return new Response(JSON.stringify({ error: 'upstash_unavailable', status: r.status, message: (data && data.error) || 'réponse Upstash invalide' }), {
          status: 503, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }
      let record = { orders: [], lastSync: 0 };
      if (typeof data.result === 'string' && data.result.length > 0) {
        try { record = JSON.parse(data.result); }
        catch (e) {
          return new Response(JSON.stringify({ error: 'cloud_illisible' }), {
            status: 503, headers: { ...CORS, 'Content-Type': 'application/json' }
          });
        }
      }
      // Format compatible jsonbin (dashboard attend {record:..., metadata:...})
      return new Response(JSON.stringify({
        record: record,
        metadata: { id: KEY, backend: 'upstash' }
      }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PUT') {
      const bodyText = await req.text();
      // ═══ GARDE-FOU : refuse un envoi qui ferait fondre le cloud (vide, ou >20 % plus petit) ═══
      // Mesure légère : STRLEN (taille en octets de la donnée actuelle), sans retélécharger 1,7 Mo.
      try {
        const newBytes = new TextEncoder().encode(bodyText).length;
        const sl = await withTimeout(fetch(`${KV_URL}/strlen/${KEY}`, {
          headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
        }), 6000);
        const sd = await sl.json().catch(() => null);
        const curBytes = (sl.ok && sd && typeof sd.result === 'number') ? sd.result : 0;
        if (curBytes >= 20000 && newBytes < curBytes * 0.8) {
          return new Response(JSON.stringify({
            error: 'BLOCKED_SHRINK_PUSH',
            message: 'Refuse un envoi de ' + newBytes + ' octets alors que le cloud en contient ' + curBytes,
            cloudBytes: curBytes
          }), { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } });
        }
      } catch (e) {}

      // Upstash SET : POST /set/<key> avec value en body
      const r = await withTimeout(fetch(`${KV_URL}/set/${KEY}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_TOKEN}`,
          'Content-Type': 'text/plain'
        },
        body: bodyText
      }), 15000);
      const result = await r.json().catch(() => ({}));

      if (!r.ok) {
        return new Response(JSON.stringify({
          error: 'upstash_error',
          status: r.status,
          result: result
        }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' }
        });
      }

      // Réponse allégée (ne renvoie plus toute la donnée)
      let recordOut = {};
      try { const p = JSON.parse(bodyText); recordOut = { lastSync: p.lastSync || 0, count: Array.isArray(p.orders) ? p.orders.length : 0 }; } catch (e) {}
      return new Response(JSON.stringify({
        record: recordOut,
        metadata: { id: KEY, backend: 'upstash', upstashResult: result }
      }), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'proxy_error',
      message: String((e && e.message) || e),
      method: req.method
    }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}
