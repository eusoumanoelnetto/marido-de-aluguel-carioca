import { Router } from 'express';
import {
  getServiceRequests,
  createServiceRequest,
  updateServiceRequestStatus,
} from '../controllers/serviceController';

const router = Router();

router.get('/', getServiceRequests);
router.post('/', createServiceRequest);
router.patch('/:id', updateServiceRequestStatus);

export default router;
