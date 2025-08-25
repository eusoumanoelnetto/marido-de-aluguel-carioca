import { Router } from 'express';
import { updateUser } from '../controllers/userController';

const router = Router();

// Route to update a user by their email
router.put('/:email', updateUser);

export default router;
