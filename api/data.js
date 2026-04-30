import { Redis } from '@upstash/redis';

const KV_KEY = 'movieNightPlanner_v2';

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.error('[api/data] Missing KV_REST_API_URL or KV_REST_API_TOKEN');
    return res.status(503).json({ error: 'Storage not configured' });
  }

  const redis = new Redis({ url, token });

  try {
    if (req.method === 'GET') {
      const data = await redis.get(KV_KEY);
      return res.status(200).json(data ?? null);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await redis.set(KV_KEY, body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/data]', err.message);
    return res.status(500).json({ error: 'Storage unavailable' });
  }
}
