import { Router } from 'express';
import { updateUser, listUsers, deleteUser, resetPassword, getAdminEvents } from '../controllers/userController';
import { authenticate, adminAccess, authenticateOrAdmin } from '../middleware/authMiddleware';

const router = Router();

// Admin events (admin only) - before other routes to avoid conflicts
router.get('/events', adminAccess, getAdminEvents);

// List users (admin only)
router.get('/', adminAccess, listUsers);

// Route to update a user by their email (protected - user can update own profile)
router.put('/:email', authenticateOrAdmin, updateUser);

// Delete user (admin only)
router.delete('/:email', adminAccess, deleteUser);

// Reset password (admin only)
router.patch('/:email/password', adminAccess, resetPassword);

export default router;
