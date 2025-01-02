import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

// Fetch Funds
export const getFunds = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const paperTradeData = await PaperTradeData.findOne({ userId });
  
      if (!paperTradeData) {
        return res.status(404).json({
          success: false,
          message: "Funds not found for this user",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Funds fetched successfully",
        data: paperTradeData.funds || {},
      });
    } catch (error) {
      console.error("Error fetching funds:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };