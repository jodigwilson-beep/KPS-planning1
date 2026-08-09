const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing sync key' }) };
  }
  const syncKey = authHeader.slice(7).trim();
  if (syncKey.length < 16) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid sync key' }) };
  }
  const userHash = hashKey(syncKey);

  const params = event.queryStringParameters || {};
  const dataKey = params.key;
  if (!dataKey || !/^[a-zA-Z0-9_-]+$/.test(dataKey)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid data key' }) };
  }

  const store = getStore('teaching-hub');
  const blobKey = `${userHash}/${dataKey}`;

  try {
    if (event.httpMethod === 'GET') {
      const value = await store.get(blobKey);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value || null })
      };
    }
    if (event.httpMethod === 'POST') {
      let bodyStr = event.body || '{}';
      if (event.isBase64Encoded) {
        bodyStr = Buffer.from(bodyStr, 'base64').toString('utf8');
      }
      const body = JSON.parse(bodyStr);
      await store.set(blobKey, body.value);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
      };
    }
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
