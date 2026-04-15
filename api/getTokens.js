// Simple in-memory cache
const cache = new Map();

export default async function handler(req, res) {
  const { account } = req.query;
  
  if (!account) {
    return res.status(400).json({ error: 'Account required' });
  }
  
  // Pārbauda cache (5 minūtes)
  const cached = cache.get(account);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return res.status(200).json(cached.data);
  }
  
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ALCHEMY_API_KEY not configured' });
  }

  const NETWORK = 'eth-sepolia';
  const alchemyUrl = `https://${NETWORK}.g.alchemy.com/v2/${apiKey}`;

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getTokenBalances",
    params: [account, "erc20"]
  };

  // Retry logic - 3 mēģinājumi
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Saglabā cache
      cache.set(account, { data, timestamp: Date.now() });
      
      return res.status(200).json(data);
    } catch (error) {
      lastError = error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  
  console.error('getTokens failed after 3 attempts:', lastError);
  return res.status(500).json({ error: 'Failed to fetch tokens after multiple attempts' });
}
