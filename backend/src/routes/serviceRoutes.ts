import { Router } from 'express';
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
  debugState,
} from '../controllers/serviceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getServiceRequests);
router.post('/', authenticate, createServiceRequest);
// debug route (dev only)
router.get('/_debug/state', debugState);
router.patch('/:id', authenticate, updateServiceRequestStatus);

export default router;
