import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { adminAccess } from '../middleware/authMiddleware';

const router = Router();

// Estatísticas do dashboard admin
router.get('/stats', adminAccess, getDashboardStats);

export default router;
