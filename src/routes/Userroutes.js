import { Router } from "express";
import {Registeruser,Loginuser,refreshAccessToken,Logoutuser} from "../controllers/User.js";
import { uploadFiles } from "../middlewares/Multer.js";
const router = Router();

router.post('/register', uploadFiles, Registeruser)
router.post('/login',Loginuser)
router.post('/refresh-token', refreshAccessToken)
router.post('/logout', Logoutuser)
//scure rouutes

export default router;