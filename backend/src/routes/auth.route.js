import { Router } from "express";
import { registerUser, verifyEmailOtp,loginUser, logoutUser,onboardingUser,resendEmailOtp } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(registerUser);
router.route("/verify-email").post(verifyEmailOtp);
router.route("/resend-email-otp").post(resendEmailOtp);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/onboarding").post(verifyJWT,onboardingUser);

export default router;