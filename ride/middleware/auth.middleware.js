const jwt = require('jsonwebtoken');
const axios = require('axios');

// Use BASE_URL from env, fallback to gateway default when not provided.
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function extractToken(req) {
    if (req.cookies && req.cookies.token) return req.cookies.token;
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) return parts[1];
    }
    return null;
}

module.exports.userAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`${BASE_URL}/user/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const user = response.data;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('userAuth error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports.captainAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const response = await axios.get(`${BASE_URL}/captain/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const captain = response.data;

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;
        next();

    } catch (error) {
        console.error('captainAuth error:', error.message);
        res.status(500).json({ message: error.message });
    }
};