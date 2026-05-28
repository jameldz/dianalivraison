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
      const r = await withTimeout(fetch(`${KV_URL}/get/${KEY}`, {
        headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
      }), 15000);
      const data = await r.json();
      let record = { orders: [], lastSync: 0 };
      if (data && typeof data.result === 'string' && data.result.length > 0) {
        try { record = JSON.parse(data.result); } catch (e) {}
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
      // ═══ GARDE-FOU : refuse push 0 si cloud a déjà >= 10 ═══
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && Array.isArray(parsed.orders) && parsed.orders.length === 0) {
          try {
            const cur = await withTimeout(fetch(`${KV_URL}/get/${KEY}`, {
              headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
            }), 6000);
            if (cur.ok) {
              const curData = await cur.json();
              if (curData && typeof curData.result === 'string' && curData.result.length > 0) {
                try {
                  const curRec = JSON.parse(curData.result);
                  const curOrders = (curRec && curRec.orders) || [];
                  if (curOrders.length >= 10) {
                    return new Response(JSON.stringify({
                      error: 'BLOCKED_EMPTY_PUSH',
                      message: 'Refuse de push 0 commandes alors que cloud a ' + curOrders.length,
                      cloudCount: curOrders.length
                    }), { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } });
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
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

      // Réponse format compatible jsonbin
      let recordOut = {};
      try { recordOut = JSON.parse(bodyText); } catch (e) {}
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
