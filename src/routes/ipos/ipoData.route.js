import { Router } from 'express';
import { verifyAdmin } from '../../middlewares/verifyAdmin.js';
import { createIPO, deleteIPO, getAllIPOs, updateIPO } from '../../controllers/ipos/ipoData.controller.js';
import { verifyUser } from '../../middlewares/verifyUser.js';

const router = Router();

// Create IPO
router.post("/create-ipo/:userId", verifyAdmin, createIPO);

// get all IPOs
router.get("/get-all-ipos", verifyUser,  getAllIPOs);

//update IPO
router.put("/update-ipo/:id", verifyAdmin, updateIPO);

//delete IPO
router.delete("/delete-ipo/:id", verifyAdmin, deleteIPO);



export default router;