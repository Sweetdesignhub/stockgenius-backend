import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

// Fetch Holdings
export const getHoldings = async (req, res) => {
  try {
    const { userId } = req.params;

    const paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "Holdings not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holdings fetched successfully",
      data: paperTradeData.holdings || [],
    });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Sell Holdings
export const sellHoldings = async (req, res) => {
  const { userId, stockSymbol, quantity } = req.body;

  try {
    const paperTradeData = await PaperTradeData.findOne({ userId });
    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "User paper trading account not found",
      });
    }

    // Find holdings
    const holding = paperTradeData.holdings.find(
      (h) => h.stockSymbol === stockSymbol
    );

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient quantity in holdings to sell",
      });
    }

    // Fetch current price
    const currentPrice = await fetchStockPrice(stockSymbol);
    const sellValue = currentPrice * quantity;

    // Update Funds
    paperTradeData.funds.availableFunds += sellValue;
    paperTradeData.funds.realizedPnL +=
      (currentPrice - holding.averagePrice) * quantity;

    // Update Holdings
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      // Remove the holding if all quantity is sold
      paperTradeData.holdings = paperTradeData.holdings.filter(
        (h) => h.stockSymbol !== stockSymbol
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
      productType: holding.productType,
      fees: 0,
    };
    paperTradeData.trades.push(newTrade);

    // Save Updates
    await paperTradeData.save();

    res.status(200).json({
      success: true,
      message: "Holdings sold successfully",
      trade: newTrade,
      funds: paperTradeData.funds,
    });
  } catch (error) {
    console.error("Error selling holdings:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
