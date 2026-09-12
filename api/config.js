// Vercel Edge Function — lecture PUBLIQUE restreinte : jours fermés + stock UNIQUEMENT.
// Ne renvoie JAMAIS les commandes / fiches clientes. Utilisé par le formulaire public
// pour afficher les créneaux et le stock, sans exposer les données personnelles.
// Miroir du même backend Upstash que api/cloud.js (clé 'diana_data').

export const config = { runtime: 'edge' };

const KEY = 'diana_data';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) {
    return new Response(JSON.stringify({ error: 'KV_NOT_CONFIGURED' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  try {
    const r = await withTimeout(fetch(`${KV_URL}/get/${KEY}`, {
      headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
    }), 15000);
    const data = await r.json();
    let record = {};
    if (data && typeof data.result === 'string' && data.result.length > 0) {
      try { record = JSON.parse(data.result); } catch (e) {}
    }
    // On ne renvoie QUE la config publique. Aucune commande, aucun client.
    const safe = {
      joursFermes: record.joursFermes || { semaine: [], dates: [] },
      stock: record.stock || {}
    };
    // Même enveloppe {record:...} que api/cloud pour ne rien changer côté client.
    return new Response(JSON.stringify({
      record: safe,
      metadata: { id: KEY, backend: 'upstash', scope: 'config' }
    }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'proxy_error', message: String((e && e.message) || e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}
