import { Router } from "express";
import rateLimit from 'express-rate-limit';
import { login, signUp, logout, forgotPassword, resetPassword, refreshTokenController, googleLogin } from "../controllers/auth.controller.js";
import { getProfile, updateProfile, changePassword, logoutAll } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
    forgotPasswordSchema,
    loginSchema,
    refreshSchema,
    resetPasswordSchema,
    signupSchema,
    updateProfileSchema,
    changePasswordSchema,
    googleLoginSchema,
} from "../validators.js";

const router = Router();

const limiter = (limit, minutes, message) =>
    rateLimit({
        windowMs: minutes * 60 * 1000,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        skip: () => process.env.NODE_ENV === 'test',
        message: { message },
    });

const authLimiter = limiter(10, 15, 'Too many attempts. Please try again in 15 minutes.');
const resetLimiter = limiter(5, 60, 'Too many password reset requests. Please try again later.');

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/signup", authLimiter, validate(signupSchema), signUp);
router.post("/auth/google", authLimiter, validate(googleLoginSchema), googleLogin);
router.post("/logout", logout);
router.post("/forgot-password", resetLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", resetLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/refresh", validate(refreshSchema), refreshTokenController);

router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, validate(updateProfileSchema), updateProfile);
router.post("/profile/password", authMiddleware, authLimiter, validate(changePasswordSchema), changePassword);
router.post("/logout-all", authMiddleware, logoutAll);

export default router;
