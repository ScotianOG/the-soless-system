// src/routes/registration/index.ts
import { Router } from 'express';
import { register } from './register';
import { getRegistrationStatus } from './getStatus';

const router = Router();

// Registration endpoints
router.post('/register', register);
router.get('/status', async (req, res) => {
  const status = await getRegistrationStatus(res.locals.prisma);
  res.json(status);
});

export const registrationRouter = router;