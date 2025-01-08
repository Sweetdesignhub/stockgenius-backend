import cron from "node-cron";
import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

const movePositionsToHoldings = async (dryRun = false) => {
  try {
    console.log("Starting process to move positions to holdings...");

    const batchSize = 100; // Process users in batches
    let skip = 0;

    while (true) {
      // Fetch users in batches to avoid memory overload
      const usersBatch = await PaperTradeData.find({}, "positions holdings")
        .skip(skip)
        .limit(batchSize);

      if (usersBatch.length === 0) break; // Exit loop if no more users

      console.log(`Processing batch of ${usersBatch.length} users...`);

      for (const user of usersBatch) {
        // Initialize holdings if not present
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

        // Get positions to move (only positions with quantity > 0)
        const positionsToMove = user.positions?.netPositions?.filter(
          (pos) => pos.quantity > 0
        ) || [];

        console.log(`User ${user._id}: ${positionsToMove.length} positions to move.`);

        // If no positions to move, skip to the next user
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
            existingHolding.unrealizedPnL =
              existingHolding.marketValue - existingHolding.investedValue;
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

        // Clear positions after moving
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

        // Save user data unless it's a dry run
        if (!dryRun) {
          await user.save();
          console.log(`User ${user._id}: Updated holdings and cleared positions.`);
        } else {
          console.log(`Dry run: User ${user._id} data processed but not saved.`);
        }
      }

      // Move to the next batch
      skip += batchSize;
    }

    console.log("Positions moved to holdings successfully.");
  } catch (error) {
    console.error("Error moving positions to holdings:", error);
  }
};

// Schedule the job to run every day at 1:29 AM IST
cron.schedule(
  "10 01 * * *",
  () => {
    console.log("Running daily cron job to move positions to holdings...");
    movePositionsToHoldings();
  },
  {
    timezone: "Asia/Kolkata", // Ensure the job runs in IST
  }
);

export default movePositionsToHoldings;
