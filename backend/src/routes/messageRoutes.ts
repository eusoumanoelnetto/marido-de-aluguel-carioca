import { Router } from 'express';
import { sendMessage, listMessagesByService, listRecentByUser } from '../controllers/messageController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, sendMessage);
router.get('/service/:serviceId', authenticate, listMessagesByService);
router.get('/me/recent', authenticate, listRecentByUser);

export default router;
