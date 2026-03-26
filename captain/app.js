// app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes - make sure this is exporting correctly
const captainRoutes = require('./routes/captain.routes');
app.use('/api/captain', captainRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'captain-service' });
});

module.exports = app;