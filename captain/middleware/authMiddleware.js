const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');

function extractToken(req) {
    if (req.cookies && req.cookies.token) return req.cookies.token;
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) return parts[1];
    }
    return null;
}

module.exports.captainAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const isBlacklisted = await blacklisttokenModel.find({ token });

        if (isBlacklisted.length) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const captain = await captainModel.findById(decoded.id);

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        next();
    } catch (error) {
        console.error('captainAuth error:', error.message);
        res.status(500).json({ message: error.message });
    }
}