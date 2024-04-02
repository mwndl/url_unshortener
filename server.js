const express = require('express');
const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const app = express();
const port = 3000;

// Stores request records per IP
const requestCountByIP = new Map();

// Token to increase request limit
const adminToken = 'replace_with_a_token'; // 5000 requests per hour (IP based)
const altToken = 'replace_with_a_token'; // 500 requests per hour (IP based)

app.use(express.json());

// Middleware to limit requests per IP
app.use((req, res, next) => {
  const clientIP = req.ip; // Get client IP

  // Check if user provided a token
  const token = req.query.token;

  // Set default limit
  let requestLimit = 100;

  // Set token name
  let token_name = 'public';

  // Check if token is valid and assign a higher limit and token name
  if (token === adminToken) {
    requestLimit = 5000; // Set admin token request limit
    token_name = "admin";
  } else if (token === altToken) {
    requestLimit = 500; // Set altToken token request limit
    token_name = "alternative token";
    // create as many tokens as you want
  } 

  // Check if IP has reached hourly request limit
  if (requestCountByIP.has(clientIP)) {
    const requestCount = requestCountByIP.get(clientIP);
    if (requestCount >= requestLimit) {
      return res.status(429).json({ error: 'Request limit exceeded for this IP.' });
    }
    requestCountByIP.set(clientIP, requestCount + 1);
  } else {
    // If IP hasn't been registered before, initialize with 1 request
    requestCountByIP.set(clientIP, 1);
  }

  // Set a timer to reset request counter after 1 hour
  setTimeout(() => {
    requestCountByIP.delete(clientIP);
  }, 3600000); // 1 hour in milliseconds

  // Set token name in request
  req.token_name = token_name;

  // Add start time of request processing
  req.startTime = Date.now();

  // Call next middleware
  next();
});

app.get('/', async (req, res) => {
  const urlParam = req.query.url;

  if (!urlParam) {
    return res.status(400).json({ 
      error: '400 - Bad Request',
      description: "No URL to unshort",
      more_information: "Please visit https://github.com/mwndl/url_unshortener for more information."
    });
  }

  // Check if provided URL starts with "http://" or "https://"
  const isHttp = urlParam.startsWith('http://');
  const isHttps = urlParam.startsWith('https://');

  // If it doesn't start with either, automatically add "http://"
  const fullUrl = isHttp || isHttps ? urlParam : `http://${urlParam}`;

  try {
    const protocol = fullUrl.startsWith('https') ? https : http;

    protocol.get(fullUrl, (response) => {
      const unshortenedUrl = response.responseUrl;

      if (unshortenedUrl) {
        if (unshortenedUrl === fullUrl) {
          return res.status(400).json({ 
            error: '400 - Bad Request',
            description: "The provided URL is already a complete URL."
          });
        }

        // Calculate execution time
        const elapsedTime = Date.now() - req.startTime;

        return res.json({ 
          url: unshortenedUrl, 
          execute_time: elapsedTime,
          token: req.token_name,
          description: "URL processed successfully."
        });

      } else {
        return res.status(400).json({ 
          error: '400 - Bad Request',
          description: "The URL provided is not a valid short URL."
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: '500 - Internal Server Error',
      description: "An error occurred while shortening the URL."
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
