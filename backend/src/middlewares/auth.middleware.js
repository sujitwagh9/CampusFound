import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token missing in Authorization header' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(403).json({ message: 'Invalid token payload' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export default authMiddleware;


// import jwt from 'jsonwebtoken';


// const authMiddleware = (req, res, next) => {
    
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ message: 'No token provided' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded; 
//         next(); 
//     } catch (error) {
//         return res.status(403).json({ message: 'Invalid token' });
//     }
// };

// export default authMiddleware;