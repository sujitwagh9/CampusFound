import { Router } from 'express';
import { getAllClaimRequests, handleClaimRequest, getAllUsers,deleteUser } from '../controllers/admin.controller.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/claim-requests', authMiddleware, roleMiddleware('admin'), getAllClaimRequests);
router.post('/claim-requests/:claimRequestId',authMiddleware, roleMiddleware('admin'), handleClaimRequest);
router.get('/users', authMiddleware, roleMiddleware('admin'), getAllUsers);
router.delete('/users/:userId', authMiddleware, roleMiddleware('admin'), deleteUser);

export default router;
