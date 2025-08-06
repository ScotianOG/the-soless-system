"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
exports.authenticateUser = authenticateUser;
exports.optionalAuth = optionalAuth;
const prisma_1 = require("../lib/prisma");
async function authenticateUser(req, res, next) {
    // Skip authentication for OPTIONS requests
    if (req.method === 'OPTIONS') {
        return next();
    }
    // Skip authentication for verification endpoints
    if (req.path.startsWith('/verifications/')) {
        return next();
    }
    // Get wallet address from query parameter or header
    const walletAddress = req.query.wallet || req.headers['x-wallet-address'];
    if (!walletAddress) {
        res.status(401).json({ error: 'No wallet address provided' });
        return;
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { wallet: walletAddress },
            include: {
                telegramAccount: true,
                discordAccount: true,
                twitterAccount: true,
                streaks: true
            }
        });
        // For new users, allow access to certain endpoints
        const allowedPaths = ['/users/get', '/stats'];
        if (!user && allowedPaths.some(path => req.path.startsWith(path))) {
            return next();
        }
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}
// Optional auth middleware that doesn't require authentication
function optionalAuth(req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }
    const walletAddress = req.query.wallet || req.headers['x-wallet-address'];
    if (!walletAddress) {
        return next();
    }
    authenticateUser(req, res, next);
}
// Alias for authenticateUser for better semantic meaning in protected routes
exports.requireAuth = authenticateUser;
