const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const schemaRoutes = require('./routes/schemaRoutes');
const { connectDB } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// In production set FRONTEND_ORIGIN (comma-separated list allowed); unset = allow all for local dev.
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim())
  : undefined;
app.use(cors({ origin: allowedOrigins || true }));
// Only metadata (headers, layouts) is ever posted; a small body cap keeps row data out by construction.
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/schema', schemaRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'DIA Backend is running' });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
