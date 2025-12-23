exports.handler = async (event) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
    };
  }

  let payload;
  try {
    payload = event.body ? JSON.parse(event.body) : null;
  } catch (error) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    };
  }

  const url = typeof payload?.url === 'string' ? payload.url.trim() : '';

  if (!url) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Missing url' }),
    };
  }

  if (!url.toLowerCase().includes('zillow.com')) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid source: url must contain zillow.com' }),
    };
  }

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({ ok: true, source: 'zillow', url }),
  };
};
