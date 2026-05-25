// Vercel Edge Function — relais transparent vers JSONbin Pro
// iPhone/réseaux qui ne peuvent pas atteindre api.jsonbin.io passent par dianalivraison.vercel.app/api/cloud
// Edge runtime = cold start < 100ms, moins de timeouts que Node Lambda.

export const config = { runtime: 'edge' };

const JBIN = '69e7f319856a6821895b22f4';
const JKEY = '$2a$10$Bl5XcpoCn.nkMDLQ4hV37OE5XSCTH0aEEAmPhQCQC9iw421Z1TPjy';

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

  try {
    if (req.method === 'GET') {
      const url = `https://api.jsonbin.io/v3/b/${JBIN}/latest?t=${Date.now()}`;
      const r = await withTimeout(fetch(url, {
        method: 'GET',
        headers: { 'X-Master-Key': JKEY }
      }), 8000);
      const text = await r.text();
      return new Response(text, {
        status: r.status,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PUT') {
      const bodyText = await req.text();
      // Garde-fou : refuse push 0 si cloud a déjà >= 10
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed && Array.isArray(parsed.orders) && parsed.orders.length === 0) {
          try {
            const cur = await withTimeout(fetch(`https://api.jsonbin.io/v3/b/${JBIN}/latest?t=${Date.now()}`, {
              headers: { 'X-Master-Key': JKEY }
            }), 6000);
            if (cur.ok) {
              const curData = await cur.json();
              const curOrders = (curData && curData.record && curData.record.orders) || [];
              if (curOrders.length >= 10) {
                return new Response(JSON.stringify({
                  error: 'BLOCKED_EMPTY_PUSH',
                  message: 'Refuse de push 0 commandes alors que le cloud a ' + curOrders.length,
                  cloudCount: curOrders.length
                }), { status: 409, headers: { ...CORS, 'Content-Type': 'application/json' } });
              }
            }
          } catch (e) {}
        }
      } catch (e) {}

      const r = await withTimeout(fetch(`https://api.jsonbin.io/v3/b/${JBIN}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JKEY
        },
        body: bodyText
      }), 12000);
      const text = await r.text();
      return new Response(text, {
        status: r.status,
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
