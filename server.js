const express = require('express');
const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const app = express();
const port = 3000;

// Armazena os registros de solicitação por IP
const requestCountByIP = new Map();

// Token para aumentar o limite de solicitações
const adminToken = 'oUoTJCv2fZNEF8lIS3CKW4ofaQTCvU'; // 5000 requests per hour (IP based)
const songstatsToken = '4btF9MED2l5wb9EgcGvXqxLrpR3gfo'; // 500 requests per hour (IP based)

app.use(express.json());

// Middleware para limitar as solicitações por IP
app.use((req, res, next) => {
  const clientIP = req.ip; // Obtém o IP do cliente

  // Verifica se o usuário forneceu um token
  const token = req.query.token;

  // Define o limite padrão
  let requestLimit = 100;

  // Define o nome do token
  let token_name = 'no token provided';

  // Verifica se o token é válido e atribui um limite maior e o nome do token
  if (token === adminToken) {
    requestLimit = 5000;
    token_name = "admin token";
  } else if (token === songstatsToken) {
    requestLimit = 500;
    token_name = "songstats token";
  }

  // Verifica se o IP atingiu o limite de solicitações por hora
  if (requestCountByIP.has(clientIP)) {
    const requestCount = requestCountByIP.get(clientIP);
    if (requestCount >= requestLimit) {
      return res.status(429).json({ error: 'Limite de solicitações excedido para este IP.' });
    }
    requestCountByIP.set(clientIP, requestCount + 1);
  } else {
    // Se o IP não foi registrado antes, inicialize com 1 solicitação
    requestCountByIP.set(clientIP, 1);
  }

  // Define um temporizador para redefinir o contador de solicitações após 1 hora
  setTimeout(() => {
    requestCountByIP.delete(clientIP);
  }, 3600000); // 1 hora em milissegundos

  // Define o nome do token na solicitação
  req.token_name = token_name;

  // Adicione o horário de início do processamento da solicitação
  req.startTime = Date.now();

  // Chama o próximo middleware
  next();
});

app.get('/', async (req, res) => {
  const urlParam = req.query.url;

  if (!urlParam) {
    return res.status(400).json({ error: 'Missing URL. Usage example: https://unshort.onrender.com/?url=www.example.com.' });
  }

  try {
    const protocol = urlParam.startsWith('https') ? https : http;

    protocol.get(urlParam, (response) => {
      const unshortenedUrl = response.responseUrl;

      if (unshortenedUrl) {
        if (unshortenedUrl === urlParam) {
          return res.status(400).json({ error: 'The provided URL is already a complete URL.' });
        }

        // Calcule o tempo de execução
        const elapsedTime = Date.now() - req.startTime;

        return res.json({ url: unshortenedUrl, token: req.token_name, execute_time: elapsedTime });
      } else {
        return res.status(400).json({ error: 'The URL provided is not a valid short URL.' });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while shortening the URL.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
