import { Router } from 'express';
import { updateUser, listUsers, deleteUser } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// List users (admin only)
router.get('/', authenticate, listUsers);

// Route to update a user by their email (protected - user can update own profile)
router.put('/:email', authenticate, updateUser);

// Delete user (admin only)
router.delete('/:email', authenticate, deleteUser);

export default router;
