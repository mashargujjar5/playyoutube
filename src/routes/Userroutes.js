import { Router } from "express";
import {Registeruser,Loginuser,refreshAccessToken,Logoutuser, getCurrentUserProfile, updateUserProfile, changePassword} from "../controllers/User.js";
import { uploadFiles } from "../middlewares/Multer.js";
import { verifyToken } from "../middlewares/auth.js";
const router = Router();

router.post('/register', uploadFiles, Registeruser)
router.post('/login',Loginuser)
router.post('/refresh-token', refreshAccessToken)
router.post('/logout', Logoutuser)
//secure routes
router.get('/profile', verifyToken, getCurrentUserProfile)
router.put('/profile', verifyToken, uploadFiles, updateUserProfile)
router.put('/change-password', verifyToken, changePassword)

export default router;