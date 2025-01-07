import yahooFinance from "yahoo-finance2";

// Suppress notices from the Yahoo Finance library
yahooFinance.suppressNotices(['yahooSurvey']);

/**
 * Fetch real-time stock price for a given stock symbol.
 * @param {string} stockSymbol - The stock symbol to fetch the price for.
 * @returns {Promise<number>} - The stock's real-time price or 0 if an error occurs.
 */
export const fetchStockPrice = async (stockSymbol) => {
  try {
    console.log(`Fetching real-time price for ticker: ${stockSymbol}`);

    // Append ".NS" for Indian stocks (customize based on region)
    const regionalSymbol = `${stockSymbol}.NS`;

    // Fetch stock data
    const stockData = await yahooFinance.quote(regionalSymbol);

    // Extract and return the regular market price
    if (stockData && stockData.regularMarketPrice !== undefined) {
      const price = stockData.regularMarketPrice;
      console.log(`Price for ${regionalSymbol}: $${price}`);
      return price;
    }

    throw new Error("Stock data is undefined or missing 'regularMarketPrice'.");
  } catch (error) {
    console.error(`Error fetching stock price for ${stockSymbol}:`, error.message);
    return 0; // Default fallback price
  }
};
