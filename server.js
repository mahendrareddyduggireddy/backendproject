const express = require('express');
const bodyParser = require('body-parser');
const transactionsRoutes = require('./routes/transactions');
const authRoutes = require('./routes/auth');
const authenticateToken = require('./middleware/authMiddleware');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/transactions', authenticateToken, transactionsRoutes); 
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});