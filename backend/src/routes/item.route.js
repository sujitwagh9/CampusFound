import express from 'express';
import authMiddleware, { optionalAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { uploadImages } from '../middlewares/upload.middleware.js';
import { claimSchema, createItemSchema, updateItemSchema } from '../validators.js';
import {
  addItem,
  getAllItem,
  getItemById,
  updateItem,
  claimRequest,
  deleteItem,
  getUserItem,
  getUserClaims,
  getItemMatches,
} from '../controllers/item.controller.js';

const router = express.Router();

router.get('/items', getAllItem);
router.post('/items', authMiddleware, uploadImages, validate(createItemSchema), addItem);
router.get('/items/:id', optionalAuth, getItemById);
router.patch('/items/:id', authMiddleware, uploadImages, validate(updateItemSchema), updateItem);
router.delete('/items/:id', authMiddleware, deleteItem);
router.get('/items/:id/matches', authMiddleware, getItemMatches);
router.post('/items/:id/claim-request', authMiddleware, validate(claimSchema), claimRequest);

router.get('/user/items', authMiddleware, getUserItem);
router.get('/user/claims', authMiddleware, getUserClaims);

export default router;
