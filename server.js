const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server - use require with ts-node for TypeScript compatibility
  try {
    // Register ts-node for TypeScript compilation
    require('ts-node/register');
    const { initializeWebSocketServer } = require('./lib/websocket-server');
    initializeWebSocketServer(server);
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
  }

  // Initialize event-driven system (replaces cron jobs)
  try {
    const { initializeEventSystem } = require('./lib/event-system');
    await initializeEventSystem();
  } catch (error) {
    console.error('Failed to initialize event system:', error);
  }

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> WebSocket server initialized');
      console.log('> Event-driven system active');
    });
});