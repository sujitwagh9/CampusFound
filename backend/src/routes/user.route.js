import { Router } from "express";
import {login, signUp, logout, forgotPassword, resetPassword, refreshTokenController} from "../controllers/auth.controller.js"
import { getProfile } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();


router.post("/login",login);
router.post("/signup",signUp);
router.post("/logout",logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshTokenController);

router.get("/profile", authMiddleware,getProfile);


export default router;