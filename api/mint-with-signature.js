import { ethers } from 'ethers';

// Manifold līguma ABI
const MANIFOLD_ABI = [
  "function mint(address to, uint256 tokenId, string memory uri) external payable"
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet, metadataUri, contractAddress } = req.body;

    if (!wallet || !metadataUri || !contractAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validācija - pārbauda vai adreses ir derīgas
    if (!ethers.isAddress(wallet) || !ethers.isAddress(contractAddress)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }

    // Ģenerē unikālu token ID
    const tokenId = Math.floor(Math.random() * 1000000);
    
    // Izveido transakcijas datus
    const iface = new ethers.Interface(MANIFOLD_ABI);
    const data = iface.encodeFunctionData('mint', [wallet, tokenId, metadataUri]);
    
    console.log(`📝 Preparing mint for ${wallet.slice(0, 10)}..., tokenId: ${tokenId}`);
    
    // Atgriež transakcijas datus, ko frontends parakstīs
    return res.status(200).json({
      success: true,
      transaction: {
        to: contractAddress,
        data: data,
        value: ethers.parseEther("0.01").toString(),
        gasLimit: "600000"
      }
    });
    
  } catch (error) {
    console.error('Mint preparation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
