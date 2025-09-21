const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://10.20.58.236:5000',
      changeOrigin: true,
      secure: false, // Allow self-signed certificates
    })
  );
};
