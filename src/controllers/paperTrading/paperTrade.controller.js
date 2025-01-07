import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

export const getPaperTradingData = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Fetch PaperTradingData for the given userId
    const paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "Paper trading data not found for this user",
      });
    }

    // 2. Extract relevant details
    const responseData = {
      funds: paperTradeData.funds || {},
      positions: paperTradeData.positions || [],
      trades: paperTradeData.trades || [],
      holdings: paperTradeData.holdings || [],
      orders: paperTradeData.orders || [], // Include orders in the response
    };

    // 3. Send Success Response
    res.status(200).json({
      success: true,
      message: "Paper trading data fetched successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching paper trading data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
