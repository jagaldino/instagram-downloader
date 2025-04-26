// Função para limitar taxa de requisições
const rateLimit = require('./rate-limit');

// Middleware de limitação de taxa
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 requisições por IP
  message: { message: 'Muitas requisições deste IP, tente novamente após 15 minutos' }
});

module.exports = limiter;
