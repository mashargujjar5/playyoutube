import { Router } from "express";
import Registeruser from "../controllers/User.js";
const router = Router();

router.post('/register',Registeruser)

export default router;