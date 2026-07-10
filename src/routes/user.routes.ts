import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';

const router = Router();

router.get('/sessions', authMiddleware, asyncHandler(userController.getSessions));
router.post('/sessions/logout', authMiddleware, asyncHandler(userController.logoutSession));
router.post('/sessions/logout-all', authMiddleware, asyncHandler(userController.logoutAllOtherSessions));
router.get('/preferences', authMiddleware, asyncHandler(userController.getPreferences));
router.post('/preferences', authMiddleware, asyncHandler(userController.updatePreferences));

export default router;
