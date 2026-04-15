// Šis fails ir rezervēts MP4 konvertācijai
// Lai to pilnībā implementētu, vajag ffmpeg piekļuvi
// Pašlaik atgriež success bez konvertācijas

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL required' });
    }
    
    // TODO: Implementēt ffmpeg konvertāciju
    // Pašlaik atgriež to pašu URL
    
    return res.status(200).json({
      success: true,
      originalUrl: videoUrl,
      mp4Url: videoUrl,
      message: 'MP4 conversion not yet implemented - returns original video'
    });
    
  } catch (error) {
    console.error('Video conversion error:', error);
    return res.status(500).json({ error: error.message });
  }
}
