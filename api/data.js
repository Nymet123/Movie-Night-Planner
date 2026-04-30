import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const KV_KEY = 'movieNightPlanner_v2';

export default async function handler(req, res) {
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
