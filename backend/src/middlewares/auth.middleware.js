import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// 401 means "authenticate (again)" — the frontend refreshes the token on 401.
// 403 is reserved for authenticated users who lack permission.
const authMiddleware = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        if (!decoded.id) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Attaches req.user when a valid token is present, but never rejects the request
export const optionalAuth = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme === 'Bearer' && token) {
        try {
            req.user = jwt.verify(token, config.jwt.secret);
        } catch {
            // treat as anonymous
        }
    }
    next();
};

export default authMiddleware;
