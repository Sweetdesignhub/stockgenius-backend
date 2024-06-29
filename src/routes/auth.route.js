import { Router } from "express";
import {
  googleSignin,
  signin,
  signout,
  signup,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/google-signin", googleSignin);
router.post("/sign-out", signout);


export default router;
