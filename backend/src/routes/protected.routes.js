import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/user', authMiddleware, (req, res) => {
  res.json({ message: 'Hello, authenticated user!', user: req.user });
});

router.get('/admin', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json({ message: 'Hello, admin!', user: req.user });
});

export default router;