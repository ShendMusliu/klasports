const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'kla-bracket-data';
const KEY = 'state';

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

exports.handler = async (event) => {
  const store = getStore({ name: STORE_NAME });

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }

  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get(KEY, { type: 'json' });
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify(data || null),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Failed to load state' }),
      };
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      await store.set(KEY, JSON.stringify(payload));
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ ok: true }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Failed to save state' }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders(),
    body: 'Method not allowed',
  };
};
