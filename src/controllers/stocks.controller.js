import { fetchStockPrice } from "../utils/yahooFinance.js";


/**
 * Controller for fetching stock price via API.
 */
export const fetchStockPriceController = async (req, res) => {
  try {
    const { stockSymbol } = req.params;

    if (!stockSymbol) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is required.",
      });
    }

    const price = await fetchStockPrice(stockSymbol);

    if (price === 0) {
      return res.status(500).json({
        success: false,
        message: `Failed to fetch stock price for ${stockSymbol}.`,
      });
    }

    return res.status(200).json({
      success: true,
      stockSymbol,
      price,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
};
