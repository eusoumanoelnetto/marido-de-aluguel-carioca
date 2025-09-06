import { Router } from 'express';
import { saveSubscription, sendTestPush } from '../controllers/pushController';
import { adminAccess } from '../middleware/authMiddleware';
const router = Router();

// Save subscriptions can be public (called from PWA install flow)
router.post('/subscribe', saveSubscription);
// Sending broadcasts should be admin only
router.post('/send-test', adminAccess, sendTestPush);

router.get('/public-key', (req, res) => {
	try {
		const key = process.env.VAPID_PUBLIC_KEY || '';
		res.status(200).json({ publicKey: key });
	} catch (e) {
		res.status(500).json({ publicKey: '' });
	}
});

export default router;
