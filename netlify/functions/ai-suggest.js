const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Simple access gate — requires the same sync key as storage, so random
    // visitors can't run up your API bill.
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing sync key' }) };
    }
    const syncKey = authHeader.slice(7).trim();
    if (syncKey.length < 16) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid sync key' }) };
    }

    if (!ANTHROPIC_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI not configured (missing ANTHROPIC_API_KEY environment variable)' }) };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let bodyStr = event.body || '{}';
    if (event.isBase64Encoded) {
      bodyStr = Buffer.from(bodyStr, 'base64').toString('utf8');
    }
    const parsed = JSON.parse(bodyStr);
    const prompt = parsed.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Anthropic API error: ' + errText }) };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e && e.message ? e.message : 'Unknown server error' })
    };
  }
};
