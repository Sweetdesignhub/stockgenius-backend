import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

// Fetch Positions
export const getPositions = async (req, res) => {
  try {
    const { userId } = req.params;

    const paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "Positions not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Positions fetched successfully",
      data: paperTradeData.positions || [],
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Exit Position
export const exitPosition = async (req, res) => {
  const { userId, stockSymbol, quantity } = req.body;

  try {
    const paperTradeData = await PaperTradeData.findOne({ userId });
    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "User paper trading account not found",
      });
    }

    // Check if the position exists
    const position = paperTradeData.positions.find(
      (pos) => pos.stockSymbol === stockSymbol
    );

    if (!position || position.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient quantity in position to exit",
      });
    }

    // Fetch current stock price
    const currentPrice = await fetchStockPrice(stockSymbol);
    const sellValue = currentPrice * quantity;

    // Update Funds
    paperTradeData.funds.availableFunds += sellValue;
    paperTradeData.funds.realizedPnL +=
      (currentPrice - position.averagePrice) * quantity;

    // Update Positions
    position.quantity -= quantity;
    if (position.quantity === 0) {
      // Remove the position if all quantity is sold
      paperTradeData.positions = paperTradeData.positions.filter(
        (pos) => pos.stockSymbol !== stockSymbol
      );
    }

    // Add Trade Record
    const newTrade = {
      stockSymbol,
      side: "SELL",
      quantity,
      price: currentPrice,
      tradeValue: sellValue,
      tradeNumber: uuidv4(),
      orderType: "MARKET",
      productType: position.productType,
      fees: 0,
    };
    paperTradeData.trades.push(newTrade);

    // Save Updates
    await paperTradeData.save();

    res.status(200).json({
      success: true,
      message: "Position exited successfully",
      trade: newTrade,
      funds: paperTradeData.funds,
    });
  } catch (error) {
    console.error("Error exiting position:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
