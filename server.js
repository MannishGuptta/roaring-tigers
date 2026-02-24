// Simple JSON Server for Render
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const port = process.env.PORT || 3002;

server.use(middlewares);
server.use(router);

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    time: new Date().toISOString(),
    message: 'Roaring Tigers API is running'
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ JSON Server is running on port ${port}`);
  console.log(`📊 Endpoints available:`);
  console.log(`   - /rms`);
  console.log(`   - /channel_partners`);
  console.log(`   - /meetings`);
  console.log(`   - /sales`);
  console.log(`   - /targets`);
  console.log(`   - /health`);
});
