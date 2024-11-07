import { validationResult } from "express-validator";
import IPOData from "../../models/ipos/ipoData.model.js";
import User from "../../models/user.js";

//create IPO
export const createIPO = async (req, res) => {
  const { userId } = req.params; 

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is admin
    if (!user.isAdmin && user.role !== "admin") {
      return res.status(403).json({ message: "You are not admin" });
    }

    // Proceed to create IPO entry
    const ipoData = new IPOData(req.body);
    console.log(ipoData);
    
    const savedIPO = await ipoData.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "IPO data saved successfully",
      data: savedIPO,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fetch all IPOs
export const getAllIPOs = async (req, res) => {
  try {
    const ipos = await IPOData.find();

    if (ipos.length === 0) {
      return res.status(404).json({ success: false, message: "No IPOs found" });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "IPOs fetched successfully",
        data: ipos,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update IPO
export const updateIPO = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  console.log(id);
  
  const updateData = req.body;

  try {
    const ipo = await IPOData.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!ipo) {
      return res.status(404).json({ success: false, message: "IPO not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "IPO updated successfully", data: ipo });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete IPO
export const deleteIPO = async (req, res) => {
  const { id } = req.params;

  try {
    const ipo = await IPOData.findByIdAndDelete(id);

    if (!ipo) {
      return res.status(404).json({ success: false, message: "IPO not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "IPO deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
