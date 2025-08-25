import { Router } from 'express';
import { updateUser } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Route to update a user by their email (protected)
router.put('/:email', authenticate, updateUser);

export default router;
