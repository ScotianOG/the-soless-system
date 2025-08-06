// src/routes/registration/register.ts
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { Platform } from '../../types';
import { RegistrationRequest } from './types';

export async function register(req: Request, res: Response): Promise<void> {
  const { wallet, platforms } = req.body as RegistrationRequest;

  try {
    // Create or update user
    const user = await prisma.user.upsert({
      where: { wallet },
      update: {},
      create: {
        wallet,
        points: 0,
        lifetimePoints: 0
      }
    });

    // Process each linked platform
    const createPlatformAccounts = Object.entries(platforms)
      .filter(([_, data]) => data.linked)
      .map(async ([platform, data]) => {
        switch (platform.toUpperCase()) {
          case Platform.TELEGRAM:
            if (data.platformId) {
              await prisma.telegramAccount.upsert({
                where: { userId: user.id },
                create: {
                  platformId: data.platformId,
                  username: data.username || 'unknown',
                  userId: user.id
                },
                update: {
                  platformId: data.platformId,
                  username: data.username || 'unknown'
                }
              });
            }
            break;
          case Platform.DISCORD:
            if (data.platformId) {
              await prisma.discordAccount.upsert({
                where: { userId: user.id },
                create: {
                  platformId: data.platformId,
                  username: data.username || 'unknown',
                  userId: user.id
                },
                update: {
                  platformId: data.platformId,
                  username: data.username || 'unknown'
                }
              });
            }
            break;
          case Platform.TWITTER:
            if (data.platformId) {
              await prisma.twitterAccount.upsert({
                where: { userId: user.id },
                create: {
                  platformId: data.platformId,
                  username: data.username || 'unknown',
                  userId: user.id
                },
                update: {
                  platformId: data.platformId,
                  username: data.username || 'unknown'
                }
              });
            }
            break;
        }
      });

    await Promise.all(createPlatformAccounts);

    res.status(201).json({ 
      message: 'Registration successful', 
      userId: user.id 
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}