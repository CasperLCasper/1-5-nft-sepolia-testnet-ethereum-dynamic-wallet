const cache = new Map();

export default async function handler(req, res) {
  const { account } = req.query;

  if (!account) {
    return res.status(400).json({ error: "Missing account parameter" });
  }

  // Pārbauda cache (5 minūtes)
  const cached = cache.get(account);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return res.status(200).json(cached.data);
  }

  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  
  if (!ALCHEMY_API_KEY) {
    console.error("ALCHEMY_API_KEY not set");
    return res.json({ result: { nfts: [] } });
  }
  
  const url = `https://eth-sepolia.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${account}`;
  
  // Retry logic - 3 mēģinājumi
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status}`);
      }

      const data = await response.json();

      const formattedNFTs = (data.ownedNfts || []).map(nft => ({
        contract: {
          address: nft.contract.address,
          symbol: nft.contract.symbol || "NFT"
        },
        id: { tokenId: nft.id.tokenId },
        balance: 1
      }));

      const result = { result: { nfts: formattedNFTs } };
      
      // Saglabā cache
      cache.set(account, { data: result, timestamp: Date.now() });
      
      return res.status(200).json(result);
    } catch (error) {
      lastError = error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  
  console.error("getAllNFTs error after retries:", lastError);
  return res.json({ result: { nfts: [] } });
}
