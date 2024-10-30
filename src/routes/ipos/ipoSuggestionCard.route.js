import { Router } from 'express';
import { verifyAdmin } from '../../middlewares/verifyAdmin.js';
import { verifyUser } from '../../middlewares/verifyUser.js';
import { 
  createIPOSuggestionCard, 
  deleteIPOSuggestionCard, 
  getAllIPOSuggestionCards, 
  updateIPOSuggestionCard 
} from '../../controllers/ipos/ipoSuggestionCard.controller.js'; // Adjust the path as needed

const router = Router();

// Create IPOSuggestionCard
router.post("/create-suggestion-card/:userId", verifyAdmin, createIPOSuggestionCard);

// Get all IPOSuggestionCards
router.get("/get-all-suggestion-cards", verifyUser, getAllIPOSuggestionCards);

// Update IPOSuggestionCard
router.put("/update-suggestion-card/:id", verifyAdmin, updateIPOSuggestionCard);

// Delete IPOSuggestionCard
router.delete("/delete-suggestion-card/:id", verifyAdmin, deleteIPOSuggestionCard);

export default router;
