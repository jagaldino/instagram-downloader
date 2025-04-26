# Instagram Downloader

Um website simples que permite aos usuários baixar qualquer mídia (fotos, vídeos, reels, stories) do Instagram apenas inserindo o URL do post.

## Características

- Interface minimalista e responsiva
- Suporte para fotos, vídeos, reels e stories do Instagram
- Feedback visual durante o processamento
- Tratamento de erros para URLs inválidos
- Limitação de taxa para evitar abusos

## Tecnologias Utilizadas

- Frontend: HTML5, CSS3 e JavaScript puro
- Backend: Node.js (funções serverless)
- Scraping: Axios e Cheerio
- Deploy: Vercel

## Executando Localmente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/instagram-downloader.git
cd instagram-downloader
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse o site em `http://localhost:3000`

## Deploy na Vercel

Para fazer o deploy deste projeto na Vercel, siga os passos abaixo:

1. Instale a CLI da Vercel (se ainda não tiver):
```bash
npm install -g vercel
```

2. Faça login na sua conta Vercel:
```bash
vercel login
```

3. Deploy do projeto:
```bash
vercel
```

4. Para fazer o deploy em produção:
```bash
vercel --prod
```

## Estrutura do Projeto

```
instagram-downloader/
├── api/
│   ├── download.js       # Função serverless para processar URLs do Instagram
│   ├── limiter.js        # Middleware de limitação de taxa
│   └── rate-limit.js     # Implementação da limitação de taxa
├── public/
│   ├── index.html        # Página principal
│   ├── styles.css        # Estilos CSS
│   └── script.js         # JavaScript do frontend
├── package.json          # Dependências e scripts
└── vercel.json           # Configuração para deploy na Vercel
```

## Dependências

- axios: Para fazer requisições HTTP
- cheerio: Para analisar e extrair dados HTML
- node-fetch: Para fazer requisições fetch no ambiente Node.js
- vercel: Para desenvolvimento local e deploy

## Aviso Legal

Este serviço é fornecido apenas para uso pessoal. Respeite os direitos autorais e os Termos de Serviço do Instagram. Ao usar este serviço, você concorda em baixar apenas conteúdo para uso pessoal e não comercial, respeitando os direitos dos criadores.

## Limitações

- O Instagram pode alterar sua estrutura HTML a qualquer momento, o que pode afetar a funcionalidade deste serviço
- Alguns conteúdos protegidos ou privados não podem ser baixados
- O serviço tem um limite de requisições por IP para evitar abusos
