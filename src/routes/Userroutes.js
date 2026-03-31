import { Router } from "express";
import {Registeruser,Loginuser,Logoutuser} from "../controllers/User.js";
import { uploadFiles } from "../middlewares/Multer.js";
import authMiddleware from "../middlewares/authmiddleware.js";
const router = Router();

router.post('/register', uploadFiles, Registeruser)
router.post('/login',Loginuser)
router.post("/logout", authMiddleware, Logoutuser)

//scure rouutes
router.post("/logout",)

export default router;