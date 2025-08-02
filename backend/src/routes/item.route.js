import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { addItem, getAllItem,updateItem , claimRequest, deleteItem,getUserItem} from '../controllers/item.controller.js';


const router = express.Router();



router.get("/items", getAllItem);
router.post('/add', authMiddleware, addItem);
router.delete('/delete/:id', authMiddleware, deleteItem); // Protected & authorized
router.put('/update/:id', authMiddleware, updateItem); // Protected & authorized
router.post('/items/:id/claim-request', authMiddleware, claimRequest); // Protected & authorized
router.get('/user/items', authMiddleware, getUserItem);


export default router;