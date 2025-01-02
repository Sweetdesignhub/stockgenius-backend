import cron from "node-cron";
import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";
import { v4 as uuidv4 } from "uuid";
import { fetchStockPrice } from "../../utils/yahooFinance.js";

const processPendingOrders = async () => {
  try {
    // Fetch all users with pending orders
    const paperTradeDataList = await PaperTradeData.find({
      "orders.status": "PENDING",
    });

    for (const paperTradeData of paperTradeDataList) {
      const { orders, funds } = paperTradeData;

      // Ensure that netPositions is an array
      if (!Array.isArray(paperTradeData.positions?.netPositions)) {
        console.log('Initializing netPositions as an empty array');
        paperTradeData.positions = { netPositions: [] }; // Initialize netPositions if it doesn't exist
      }

      for (const order of orders) {
        if (order.status === "PENDING") {
          const currentPrice = await fetchStockPrice(order.stockSymbol);
          console.log("Current price for", order.stockSymbol, ":", currentPrice);

          let orderFilled = false;

          // Check if LIMIT or STOP LOSS conditions match
          if (order.orderType === "LIMIT") {
            if (order.action === "BUY" && order.limitPrice <= currentPrice) {
              order.status = "EXECUTED";
              order.tradedPrice = order.limitPrice;
              order.filledQuantity = order.quantity;
            } else if (order.action === "SELL" && order.limitPrice >= currentPrice) {
              order.status = "EXECUTED";
              order.tradedPrice = order.limitPrice;
              order.filledQuantity = order.quantity;
            }
          } else if (order.orderType === "STOP_LOSS") {
            if (order.stopPrice <= currentPrice) {
              order.status = "EXECUTED";
              order.tradedPrice = order.stopPrice;
              order.filledQuantity = order.quantity;
            }
          }

          // If the order has been filled, update the funds and positions
          if (order.status === "EXECUTED") {
            const orderCost = order.quantity * order.tradedPrice;

            if (order.action === "BUY") {
              funds.reservedFunds -= orderCost;
              funds.availableFunds -= orderCost;
            } else if (order.action === "SELL") {
              funds.availableFunds += orderCost;
            }

            paperTradeData.trades.push({
              stockSymbol: order.stockSymbol,
              side: order.action,
              quantity: order.quantity,
              price: order.tradedPrice,
              tradeValue: orderCost,
              tradeNumber: uuidv4(),
              orderType: order.orderType,
              productType: order.productType,
              fees: 0, // Add fees if applicable
            });

            // Debugging: Log the netPositions array before using find
            console.log('netPositions array before find:', paperTradeData.positions.netPositions);

            // Update positions
            const existingPosition = paperTradeData.positions.netPositions.find(
              (pos) => pos.stockSymbol === order.stockSymbol
            );

            if (order.action === "BUY") {
              if (existingPosition) {
                existingPosition.averagePrice =
                  (existingPosition.averagePrice * existingPosition.quantity +
                    order.tradedPrice * order.quantity) /
                  (existingPosition.quantity + order.quantity);
                existingPosition.quantity += order.quantity;
              } else {
                paperTradeData.positions.netPositions.push({
                  stockSymbol: order.stockSymbol,
                  quantity: order.quantity,
                  averagePrice: order.tradedPrice,
                  lastTradedPrice: currentPrice,
                  productType: order.productType,
                });
              }
            } else if (order.action === "SELL") {
              if (existingPosition) {
                existingPosition.quantity -= order.quantity;
                if (existingPosition.quantity <= 0) {
                  paperTradeData.positions.netPositions = paperTradeData.positions.netPositions.filter(
                    (pos) => pos.stockSymbol !== order.stockSymbol
                  );
                }
              }
            }

            orderFilled = true;
          }

          if (orderFilled) {
            console.log(`Order ${order.virtualOrderId} has been filled.`);
          }
        }
      }

      // Save the updated paperTradeData after processing all orders for the user
      await paperTradeData.save();
    }

    console.log("Pending orders processed successfully.");
  } catch (error) {
    console.error("Error processing pending orders:", error);
  }
};



// Schedule the job to run every 10 seconds
cron.schedule("*/10 * * * * *", processPendingOrders);

export default processPendingOrders;
