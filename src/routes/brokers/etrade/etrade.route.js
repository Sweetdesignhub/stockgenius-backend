import { Router } from 'express';
import { fetchProfileAndSave, generateAccessToken, generateAuthCodeUrl } from '../../../controllers/brokers/etrade/etrade.controller.js';

const router = Router();

router.get('/auth/:userId', generateAuthCodeUrl); 
router.get('/callback', generateAccessToken); 
router.get('/profile/:userId', fetchProfileAndSave);

export default router;
