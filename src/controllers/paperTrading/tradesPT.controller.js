import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

// Fetch Trades
export const getTrades = async (req, res) => {
    try {
      const { userId } = req.params;
  
      const paperTradeData = await PaperTradeData.findOne({ userId });
  
      if (!paperTradeData) {
        return res.status(404).json({
          success: false,
          message: "Trades not found for this user",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Trades fetched successfully",
        data: paperTradeData.trades || [],
      });
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };