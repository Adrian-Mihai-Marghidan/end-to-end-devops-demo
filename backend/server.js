// backend/server.js
const http = require('http');   // built-in HTTP server
const port = 3000;              // backend listens on port 3000
let hits = 0;                   // counter for Prometheus

// This is our request handler logic
function handler(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('OK\n');
  }

  if (req.url === '/metrics') {
    hits++;
    res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end(`# HELP app_requests_total Total requests\n# TYPE app_requests_total counter\napp_requests_total ${hits}\n`);
  }

  res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
  res.end('Backend says hai noroc bade Vasile!\n');
}

// If this file is run directly → start the server
if (require.main === module) {
  http.createServer(handler).listen(port, () => console.log(`Backend running on :${port}`));
}

// Export handler so unit tests can import it
module.exports = { handler };
