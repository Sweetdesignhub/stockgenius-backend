import { validationResult } from "express-validator";
import IPOSuggestionCard from "../../models/ipos/ipoSuggestionCard.model.js"; // Adjust the path as needed
import User from "../../models/user.js";

// Create IPOSuggestionCard
export const createIPOSuggestionCard = async (req, res) => {
  const { userId } = req.params; 
  console.log(userId);
  

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is admin
    if (!user.isAdmin && user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized" });
    }

    // Proceed to create IPOSuggestionCard entry
    const iposuggestionCard = new IPOSuggestionCard(req.body);
    const savedSuggestionCard = await iposuggestionCard.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "IPOSuggestionCard data saved successfully",
      data: savedSuggestionCard,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Fetch all IPOSuggestionCards
export const getAllIPOSuggestionCards = async (req, res) => {
  try {
    const suggestionCards = await IPOSuggestionCard.find();

    if (suggestionCards.length === 0) {
      return res.status(404).json({ success: false, message: "No suggestion cards found" });
    }

    res.status(200).json({
      success: true,
      message: "IPOSuggestionCards fetched successfully",
      data: suggestionCards,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update IPOSuggestionCard
export const updateIPOSuggestionCard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  
  const updateData = req.body;

  try {
    const suggestionCard = await IPOSuggestionCard.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!suggestionCard) {
      return res.status(404).json({ success: false, message: "IPOSuggestionCard not found" });
    }

    res.status(200).json({ success: true, message: "IPOSuggestionCard updated successfully", data: suggestionCard });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete IPOSuggestionCard
export const deleteIPOSuggestionCard = async (req, res) => {
  const { id } = req.params;

  try {
    const suggestionCard = await IPOSuggestionCard.findByIdAndDelete(id);

    if (!suggestionCard) {
      return res.status(404).json({ success: false, message: "IPOSuggestionCard not found" });
    }

    res.status(200).json({ success: true, message: "IPOSuggestionCard deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
