// Try to load json-server, with error handling
let jsonServer;
try {
  jsonServer = require('json-server');
} catch (err) {
  console.error('Failed to load json-server. Please run: npm install json-server');
  console.error(err);
  process.exit(1);
}

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// Use the port Render provides or fallback to 3002
const port = process.env.PORT || 3002

server.use(middlewares)
server.use(router)

// Add a test endpoint
server.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV || 'development'
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`JSON Server is running on port ${port}`)
  console.log(`Endpoints:`)
  console.log(`  http://0.0.0.0:${port}/rms`)
  console.log(`  http://0.0.0.0:${port}/channel_partners`)
  console.log(`  http://0.0.0.0:${port}/meetings`)
  console.log(`  http://0.0.0.0:${port}/sales`)
  console.log(`  http://0.0.0.0:${port}/targets`)
  console.log(`  http://0.0.0.0:${port}/health`)
})
