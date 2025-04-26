// Função serverless para processar URLs do Instagram
const axios = require('axios');
const cheerio = require('cheerio');
const limiter = require('./limiter');

// Aplicar middleware de limitação de taxa
module.exports = async (req, res) => {
  // Aplicar limitador de taxa
  try {
    await new Promise((resolve, reject) => {
      limiter(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (error) {
    return res.status(429).json({ message: 'Muitas requisições, tente novamente mais tarde' });
  }
  // Configurar CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se a requisição é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido. Use POST.' });
  }

  try {
    // Obter URL do corpo da requisição
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL não fornecida' });
    }

    // Validar URL do Instagram
    if (!isValidInstagramUrl(url)) {
      return res.status(400).json({ message: 'URL do Instagram inválida' });
    }

    // Implementar limitação de taxa básica
    // Aqui usamos um contador simples, em produção seria melhor usar Redis ou similar
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Obter dados da mídia do Instagram
    const mediaData = await fetchInstagramMedia(url);

    // Retornar dados da mídia
    return res.status(200).json(mediaData);
  } catch (error) {
    console.error('Erro ao processar URL:', error);
    return res.status(500).json({ 
      message: error.message || 'Erro ao processar URL do Instagram' 
    });
  }
};

// Função para validar URL do Instagram
function isValidInstagramUrl(url) {
  const regex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|stories)\/[^\/]+\/?/;
  return regex.test(url);
}

// Função para obter dados da mídia do Instagram
async function fetchInstagramMedia(url) {
  try {
    // Fazer requisição para a página do Instagram
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });

    // Extrair dados da página usando Cheerio
    const $ = cheerio.load(response.data);
    
    // Tentar encontrar metadados da mídia
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogVideo = $('meta[property="og:video"]').attr('content');
    const ogTitle = $('meta[property="og:title"]').attr('content') || 'Instagram Media';
    
    // Tentar encontrar dados JSON na página
    let mediaUrl = null;
    let mediaType = null;
    
    // Primeiro, tentar encontrar dados em scripts JSON
    const scripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const scriptContent = $(scripts[i]).html();
        if (scriptContent) {
          const jsonData = JSON.parse(scriptContent);
          
          // Verificar se temos dados de mídia no JSON
          if (jsonData && jsonData.video) {
            mediaUrl = jsonData.video.contentUrl;
            mediaType = 'video';
            break;
          } else if (jsonData && jsonData.image) {
            mediaUrl = Array.isArray(jsonData.image) ? jsonData.image[0].url : jsonData.image.url;
            mediaType = 'image';
            break;
          }
        }
      } catch (e) {
        // Ignorar erros de parsing JSON
        console.error('Erro ao analisar JSON:', e);
      }
    }
    
    // Se não encontrou nos scripts JSON, usar os metadados OG
    if (!mediaUrl) {
      if (ogVideo) {
        mediaUrl = ogVideo;
        mediaType = 'video';
      } else if (ogImage) {
        mediaUrl = ogImage;
        mediaType = 'image';
      }
    }
    
    // Se ainda não encontrou, procurar em outros elementos da página
    if (!mediaUrl) {
      // Procurar vídeos
      const videoSrc = $('video source').attr('src') || $('video').attr('src');
      if (videoSrc) {
        mediaUrl = videoSrc;
        mediaType = 'video';
      } else {
        // Procurar imagens
        const imgSrc = $('.EmbeddedMediaImage').attr('src') || 
                      $('article img').attr('src') || 
                      $('div[role="button"] img').attr('src');
        if (imgSrc) {
          mediaUrl = imgSrc;
          mediaType = 'image';
        }
      }
    }
    
    // Se ainda não encontrou, tentar extrair de dados embutidos
    if (!mediaUrl) {
      const sharedDataScript = $('script:contains("window._sharedData")').html();
      if (sharedDataScript) {
        const sharedDataMatch = sharedDataScript.match(/window\._sharedData = (.+);/);
        if (sharedDataMatch && sharedDataMatch[1]) {
          try {
            const sharedData = JSON.parse(sharedDataMatch[1]);
            const mediaData = sharedData.entry_data.PostPage[0].graphql.shortcode_media;
            
            if (mediaData.is_video) {
              mediaUrl = mediaData.video_url;
              mediaType = 'video';
            } else {
              mediaUrl = mediaData.display_url;
              mediaType = 'image';
            }
          } catch (e) {
            console.error('Erro ao extrair dados embutidos:', e);
          }
        }
      }
    }
    
    // Se não encontrou nenhuma mídia, lançar erro
    if (!mediaUrl) {
      throw new Error('Não foi possível encontrar a mídia neste URL');
    }
    
    // Gerar nome de arquivo baseado no URL
    const urlParts = url.split('/');
    const postId = urlParts[urlParts.indexOf('p') + 1] || 
                  urlParts[urlParts.indexOf('reel') + 1] || 
                  urlParts[urlParts.indexOf('stories') + 1] || 
                  'instagram-media';
    
    const filename = `instagram-${postId}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    
    // Retornar dados da mídia
    return {
      url: mediaUrl,
      type: mediaType,
      filename: filename,
      title: ogTitle
    };
  } catch (error) {
    console.error('Erro ao obter mídia do Instagram:', error);
    throw new Error('Não foi possível obter a mídia do Instagram. Verifique se o URL é válido.');
  }
}
