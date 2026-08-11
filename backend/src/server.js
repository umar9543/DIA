const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const schemaRoutes = require('./routes/schemaRoutes');
// const dataRoutes = require('./routes/dataRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes (will be enabled once implemented)
// app.use('/api/schema', schemaRoutes);
// app.use('/api/data', dataRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'DIA Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
