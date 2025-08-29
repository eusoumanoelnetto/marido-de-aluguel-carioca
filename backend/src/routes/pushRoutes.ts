import { Router } from 'express';
import { saveSubscription, sendTestPush } from '../controllers/pushController';
const router = Router();

router.post('/subscribe', saveSubscription);
router.post('/send-test', sendTestPush);

router.get('/public-key', (req, res) => {
	try {
		const key = process.env.VAPID_PUBLIC_KEY || '';
		res.status(200).json({ publicKey: key });
	} catch (e) {
		res.status(500).json({ publicKey: '' });
	}
});

export default router;
