import { Router } from 'express';
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
} from '../controllers/serviceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticate, getServiceRequests);
router.post('/', authenticate, createServiceRequest);
router.patch('/:id', authenticate, updateServiceRequestStatus);

export default router;
