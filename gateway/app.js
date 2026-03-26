const express = require('express')
const client = require('prom-client');
const expressProxy = require('express-http-proxy')
const http = require('http');

const app = express()

// Proxy configuration with better error handling
const proxyConfig = {
  proxyErrorHandler: (err, res, next) => {
    console.error('Proxy error:', err.message);
    res.status(503).json({ 
      error: 'Service unavailable', 
      service: err.req?.url,
      message: 'The service is currently unavailable. Please try again later.'
    });
  },
  timeout: 10000,
  // Don't fail on startup if services aren't ready
  memoizeHost: false
};

// Add a delay before starting to accept requests
const startupDelay = 5000; // 5 seconds delay

// Create proxy middleware with lazy loading
const createProxy = (target) => {
  return expressProxy(target, {
    ...proxyConfig,
    // Add retry logic
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.timeout = 10000;
      return proxyReqOpts;
    }
  });
};

// Apply proxy routes
app.use('/user', createProxy('http://user-service:3001'));
app.use('/captain', createProxy('http://captain-service:3002'));
app.use('/ride', createProxy('http://ride-service:3003'));

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ 
  prefix: 'myapp_', 
  timeout: 5000   
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

app.get("/health", (req, res) => {
  return res.status(200).json({ 
    message: "healthy",
    service: "gateway-service",
    timestamp: new Date().toISOString()
  });
});

// Start server with delay to allow other services to start
setTimeout(() => {
  app.listen(3000, () => {
    console.log('Gateway server listening on port 3000');
    console.log('Gateway is ready to accept connections');
  });
}, startupDelay);