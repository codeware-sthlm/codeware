import express from 'express';
import payload from 'payload';

// Create an Express server
const app = express();

// Let Express serve assets when needed but it's not required by Payload.
// app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Could be useful if we need a separate API parallel to Payload.
// GraphQL use /api so try to avoid conflicts by using another endoint.
// app.get('/_api', (req, res) => {
//   res.send({ message: 'Welcome to our custom api!' });
// });

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin');
});

// Initialize Payload
payload.init({
  secret: process.env.PAYLOAD_SECRET_KEY,
  express: app,
  onInit: () => {
    payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    payload.logger.info(`Using DB adapter: ${payload.db.name}`);
  },
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`[ started ] on port ${port} (${process.env.NODE_ENV})`);
});
server.on('error', console.error);
