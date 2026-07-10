import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.get('/quote', authMiddleware, asyncHandler(stockController.getQuote));
router.get('/profile', authMiddleware, asyncHandler(stockController.getProfile));
router.get('/history', authMiddleware, asyncHandler(stockController.getHistory));
router.get('/search', authMiddleware, asyncHandler(stockController.search));

export default router;
