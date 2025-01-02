import cron from "node-cron";
import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

const movePositionsToHoldings = async () => {
  try {
    const allUsers = await PaperTradeData.find();

    console.log("Fetched users:", allUsers);

    for (const user of allUsers) {
      // Initialize holdings if it does not exist
      if (!user.holdings) {
        user.holdings = {
          holdingsSummarySchema: {
            totalInvested: 0,
            totalMarketValue: 0,
            totalPnL: 0,
            totalPnLPercentage: 0,
            totalHoldingsCount: 0,
          },
          holdings: [],
        };
      }

      // Ensure positions is an array before filtering, using netPositions
      const positionsToMove = user.positions && user.positions.netPositions
        ? user.positions.netPositions.filter((pos) => pos.quantity > 0)
        : [];

      console.log("Positions to move:", positionsToMove);

      // If there are no positions to move, continue to the next user
      if (positionsToMove.length === 0) continue;

      positionsToMove.forEach((position) => {
        const { stockSymbol, quantity, avgPrice, ltp } = position;

        // Calculate values for the new holding
        const investedValue = avgPrice * quantity;
        const marketValue = ltp * quantity;
        const unrealizedPnL = marketValue - investedValue;

        // Check if the stock already exists in holdings
        const existingHolding = user.holdings.holdings.find(
          (holding) => holding.stockSymbol === stockSymbol
        );

        if (existingHolding) {
          // Update existing holding
          const totalQuantity = existingHolding.quantity + quantity;
          existingHolding.averagePrice =
            (existingHolding.averagePrice * existingHolding.quantity +
              avgPrice * quantity) /
            totalQuantity;
          existingHolding.quantity = totalQuantity;
          existingHolding.investedValue += investedValue;
          existingHolding.marketValue += marketValue;
          existingHolding.unrealizedPnL = existingHolding.marketValue - existingHolding.investedValue;
        } else {
          // Add a new holding
          user.holdings.holdings.push({
            stockSymbol,
            quantity,
            averagePrice: avgPrice,
            lastTradedPrice: ltp,
            investedValue,
            marketValue,
            unrealizedPnL,
            exchange: "NSE", // Default exchange or retrieve dynamically
          });
        }
      });

      // Clear positions after moving (set netPositions to empty array and reset summary)
      user.positions.netPositions = [];
      user.positions.summary = {
        totalCount: 0,
        openCount: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
      };

      // Update holdings summary
      const totalInvested = user.holdings.holdings.reduce(
        (sum, holding) => sum + holding.investedValue,
        0
      );
      const totalMarketValue = user.holdings.holdings.reduce(
        (sum, holding) => sum + holding.marketValue,
        0
      );
      const totalPnL = totalMarketValue - totalInvested;
      const totalPnLPercentage = totalInvested
        ? (totalPnL / totalInvested) * 100
        : 0;
      const totalHoldingsCount = user.holdings.holdings.length;

      user.holdings.holdingsSummarySchema = {
        totalInvested,
        totalMarketValue,
        totalPnL,
        totalPnLPercentage,
        totalHoldingsCount,
      };

      // Save user data
      await user.save();
    }

    console.log("Positions moved to holdings successfully, positions and summary cleared.");
  } catch (error) {
    console.error("Error moving positions to holdings:", error);
  }
};

// Schedule the job to run every day at 1:08 AM IST
cron.schedule("29 01 * * *", () => {
  console.log("Running daily cron job to move positions to holdings...");
  movePositionsToHoldings();
});

export default movePositionsToHoldings;
