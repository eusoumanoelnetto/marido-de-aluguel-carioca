import { Router } from 'express';
import { getDashboardStats, cleanTestData } from '../controllers/dashboardController';
import { adminAccess } from '../middleware/authMiddleware';

const router = Router();

// Estatísticas do dashboard admin
router.get('/stats', adminAccess, getDashboardStats);

// Limpar dados de teste (usar com cuidado!)
router.delete('/clean-test-data', adminAccess, cleanTestData);

export default router;
