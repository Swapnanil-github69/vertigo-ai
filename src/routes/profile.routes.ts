import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/asyncHandler';
import { upload } from '../services/image-upload.service';

const router = Router();

// Protect all profile endpoints with JWT Authentication middleware
router.use(authMiddleware);

router.get('/', asyncHandler(profileController.getProfile));
router.put('/', asyncHandler(profileController.updateProfile));
router.post('/avatar', upload.single('avatar'), asyncHandler(profileController.uploadAvatar));
router.delete('/avatar', asyncHandler(profileController.deleteAvatar));
router.post('/avatar/revert', asyncHandler(profileController.revertAvatar));
router.post('/sync', asyncHandler(profileController.syncGoogleProfile));

router.get('/sessions', asyncHandler(profileController.getActiveSessions));
router.post('/sessions/logout', asyncHandler(profileController.logoutSession));
router.post('/sessions/logout-all', asyncHandler(profileController.logoutAllSessions));

router.delete('/delete-account', asyncHandler(profileController.deleteAccount));

export default router;
