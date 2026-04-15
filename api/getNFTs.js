import fetch from 'node-fetch';

const cache = new Map();

export default async function handler(req, res) {
  const { account } = req.query;
  if (!account) return res.status(400).json({ error: "Missing account" });

  const CONTRACT = "0x1EF02c3Ed33a98c10F0bf1fd71e4D226e8e408A5";
  const API_KEY = process.env.ALCHEMY_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "ALCHEMY_API_KEY not configured" });
  }

  const url = `https://eth-sepolia.g.alchemy.com/nft/v2/${API_KEY}/getNFTs/?owner=${account}&contractAddresses[]=${CONTRACT}`;

  // Pārbauda cache
  const cacheKey = `${account}_${CONTRACT}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return res.status(200).json(cached.data);
  }

  // Retry logic
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const ownsNFT = data.ownedNfts && data.ownedNfts.length > 0;
      const result = { ownsNFT, nfts: data.ownedNfts || [] };
      
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return res.status(200).json(result);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  
  return res.status(500).json({ error: "Failed to fetch NFTs after multiple attempts" });
}
