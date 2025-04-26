// Implementação simples de limitação de taxa para funções serverless
// Este módulo armazena contadores em memória (para ambiente de desenvolvimento)
// Em produção, seria melhor usar Redis ou outro armazenamento persistente

// Armazenamento em memória para IPs e contadores
const ipRequests = new Map();

/**
 * Middleware de limitação de taxa
 * @param {Object} options Opções de configuração
 * @param {number} options.windowMs Janela de tempo em milissegundos
 * @param {number} options.max Número máximo de requisições permitidas na janela de tempo
 * @param {Object} options.message Mensagem de erro quando o limite é excedido
 */
function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // Padrão: 1 minuto
  const max = options.max || 5; // Padrão: 5 requisições
  const message = options.message || { message: 'Muitas requisições, tente novamente mais tarde' };

  // Limpar entradas antigas periodicamente
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequests.entries()) {
      if (now - data.timestamp > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, windowMs);

  // Retornar middleware
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               'unknown';
    
    const now = Date.now();
    
    if (!ipRequests.has(ip)) {
      // Primeira requisição deste IP
      ipRequests.set(ip, {
        count: 1,
        timestamp: now
      });
      return next();
    }
    
    const ipData = ipRequests.get(ip);
    
    // Verificar se a janela de tempo expirou
    if (now - ipData.timestamp > windowMs) {
      // Reiniciar contador
      ipRequests.set(ip, {
        count: 1,
        timestamp: now
      });
      return next();
    }
    
    // Incrementar contador
    ipData.count += 1;
    ipRequests.set(ip, ipData);
    
    // Verificar se excedeu o limite
    if (ipData.count > max) {
      return res.status(429).json(message);
    }
    
    return next();
  };
}

module.exports = rateLimit;
