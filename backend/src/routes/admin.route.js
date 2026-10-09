import { Router } from 'express';
import {
  getAllClaimRequests,
  handleClaimRequest,
  deleteClaimRequest,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getStats,
} from '../controllers/admin.controller.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { claimDecisionSchema, roleSchema } from '../validators.js';

const router = Router();

router.use(authMiddleware, roleMiddleware('admin'));

router.get('/stats', getStats);
router.get('/claim-requests', getAllClaimRequests);
router.post('/claim-requests/:claimRequestId', validate(claimDecisionSchema), handleClaimRequest);
router.delete('/claim-requests/:claimRequestId', deleteClaimRequest);
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', validate(roleSchema), updateUserRole);
router.delete('/users/:userId', deleteUser);

export default router;
