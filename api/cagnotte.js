// Vercel Edge Function — calcul de la cagnotte CÔTÉ SERVEUR.
// Le formulaire public envoie UN numéro (POST {tel}) et ne reçoit QUE :
//   - les commandes de CETTE cliente (ses propres données),
//   - le crédit calculé (dispo, sources, déjà utilisé).
// Il ne reçoit JAMAIS les fiches des autres clientes.
// La logique de crédit est une COPIE EXACTE de checkCagnotteDispo() du formulaire
// (vérifiée équivalente sur données réelles avant mise en service).

export const config = { runtime: 'edge' };

const KEY = 'diana_data';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout_' + ms + 'ms')), ms))
  ]);
}

function _normTel(t){
  if(!t) return '';
  t = String(t).replace(/\D/g,'');
  if(!t) return '';
  if(t.indexOf('00')===0 && t.length>=11) t = t.substring(2);
  if(t.length===10 && t.charAt(0)==='0') t = '33'+t.substring(1);
  if(t.length===12 && t.indexOf('330')===0) t = '33'+t.substring(3);
  if(t.length>11 && t.indexOf('3333')===0) t = t.substring(2);
  return t;
}

function computeCagnotte(allOrders, telNorm){
  var mesCommandes = allOrders.filter(function(o){
    return _normTel(o.tel)===telNorm;
  }).sort(function(a,b){return (a.createdAt||0)-(b.createdAt||0);});

  var vendeurFidele = (mesCommandes[0] && (mesCommandes[0].vendeur||'').toLowerCase().trim()) || '';
  var pendingCount = mesCommandes.filter(function(o){
    return !o.fantome && !(o.livree && o.payee);
  }).length;

  var hasPaid = mesCommandes.some(function(o){return o.payee && !o.fantome;});
  if(!hasPaid){
    return { ownOrders:mesCommandes, hasPaid:false, vendeurFidele:vendeurFidele,
      pendingCount:pendingCount, creditDispo:0, nbFilleules:0, nbFoisFilleule:0, creditUsed:0 };
  }

  var monVendeur = (mesCommandes[0] && (mesCommandes[0].vendeur||'').toLowerCase().trim()) || '';

  var creditMarraine = 0, nbFilleules = 0;
  allOrders.forEach(function(o){
    if(!o.parrain || !o.payee || o.fantome || o.parrStatus==='rejected') return;
    if(_normTel(o.parrain)!==telNorm) return;
    if(o.parrStatus!=='validated'){
      var fV = (o.vendeur||'').toLowerCase().trim();
      if(!fV || (monVendeur && fV!==monVendeur)) return;
    }
    nbFilleules++;
    creditMarraine += 5;
  });

  var creditFilleule = 0, nbFoisFilleule = 0;
  mesCommandes.forEach(function(o){
    if(!o.parrain || !o.payee || o.fantome || o.parrStatus==='rejected') return;
    if(o.parrStatus!=='validated'){
      var marraineTel = _normTel(o.parrain);
      var marraineVend = '';
      var marraineHasPaid = false;
      allOrders.forEach(function(y){
        if(_normTel(y.tel)===marraineTel){
          if(!marraineVend) marraineVend = (y.vendeur||'').toLowerCase().trim();
          if(y.payee && !y.fantome) marraineHasPaid = true;
        }
      });
      if(!marraineHasPaid) return;
      if(marraineVend && monVendeur && marraineVend!==monVendeur) return;
    }
    nbFoisFilleule++;
    creditFilleule += 5;
  });

  var creditUsed = 0;
  mesCommandes.forEach(function(o){
    if(o.creditApplied) creditUsed += parseFloat(o.creditApplied)||0;
  });

  var creditDispo = Math.max(0, (creditMarraine + creditFilleule) - creditUsed);

  return { ownOrders:mesCommandes, hasPaid:true, vendeurFidele:vendeurFidele,
    pendingCount:pendingCount, nbFilleules:nbFilleules, nbFoisFilleule:nbFoisFilleule,
    creditUsed:creditUsed, creditDispo:creditDispo };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
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
    let tel = '';
    try { const body = await req.json(); tel = (body && body.tel) || ''; } catch (e) {}
    const telNorm = _normTel(tel);
    if (!telNorm || telNorm.length < 9) {
      return new Response(JSON.stringify({ ownOrders: [], hasPaid: false, creditDispo: 0, nbFilleules: 0, nbFoisFilleule: 0, creditUsed: 0, pendingCount: 0 }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const r = await withTimeout(fetch(`${KV_URL}/get/${KEY}`, {
      headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
    }), 15000);
    const data = await r.json();
    let record = { orders: [] };
    if (data && typeof data.result === 'string' && data.result.length > 0) {
      try { record = JSON.parse(data.result); } catch (e) {}
    }
    const allOrders = (record && record.orders) || [];

    const result = computeCagnotte(allOrders, telNorm);
    // On ne renvoie QUE les champs utiles au formulaire (pas de notes internes, etc.).
    const CHAMPS = ['num','nom','snap','email','addr','vendeur','payee','livree','fantome','deletedAt','prods','createdAt','tel','parrain','parrStatus','creditApplied'];
    result.ownOrders = (result.ownOrders || []).map(function(o){
      var c = {};
      for (var i = 0; i < CHAMPS.length; i++) { if (o[CHAMPS[i]] !== undefined) c[CHAMPS[i]] = o[CHAMPS[i]]; }
      return c;
    });
    // On ne renvoie QUE les commandes de cette cliente + les chiffres de crédit.
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'proxy_error', message: String((e && e.message) || e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
}
