const jsonServer = require('json-server')
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
  console.log(`  http://localhost:${port}/rms`)
  console.log(`  http://localhost:${port}/channel_partners`)
  console.log(`  http://localhost:${port}/meetings`)
  console.log(`  http://localhost:${port}/sales`)
  console.log(`  http://localhost:${port}/targets`)
  console.log(`  http://localhost:${port}/health`)
})
