require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./config/db');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api/products', productRoutes);

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ message: 'Request body must be valid JSON.' });
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({ message: 'Cannot connect to MySQL. Check that MySQL is running and backend/.env is configured.' });
  }
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

app.listen(PORT, () => console.log(`Inventory app running at http://localhost:${PORT}`));
