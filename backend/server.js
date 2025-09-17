const http = require('http');          // built-in HTTP server
const port = 3000;                     // backend listens on port 3000
let hits = 0;                          // counter for Prometheus

// Create a web server
const srv = http.createServer((req, res) => {

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'text/plain'});
    return res.end('OK\n');
  }

  // Prometheus metrics endpoint
  if (req.url === '/metrics') {
    hits++;
    res.writeHead(200, {'Content-Type':'text/plain'});
    return res.end(`# HELP app_requests_total Total requests\n# TYPE app_requests_total counter\napp_requests_total ${hits}\n`);
  }

  // Default route
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end('Backend says hai noroc bre!\n');
});

// Start the server
srv.listen(port, () => console.log(`Backend running on :${port}`));
