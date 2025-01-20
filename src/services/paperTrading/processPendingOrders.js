import cron from "node-cron";
import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";
import { v4 as uuidv4 } from "uuid";
import { fetchStockPrice } from "../../utils/yahooFinance.js";

// Cache to store fetched stock prices to avoid repeated calls
const stockPriceCache = {};

const processPendingOrders = async () => {
  try {
    // Fetch all users with pending orders
    const paperTradeDataList = await PaperTradeData.find({
      "orders.status": "PENDING",
    });

    for (const paperTradeData of paperTradeDataList) {
      const { orders, funds, positions } = paperTradeData;

      // Ensure that netPositions is an array
      if (!Array.isArray(paperTradeData.positions?.netPositions)) {
        console.log("Initializing netPositions as an empty array");
        paperTradeData.positions = { netPositions: [] }; // Initialize netPositions if it doesn't exist
      }

      for (const order of orders) {
        if (order.status === "PENDING") {
          // Log pending orders
          console.log("Pending Order Details:");
          console.log(`Order ID: ${order.virtualOrderId}`);
          console.log(`Stock Symbol: ${order.stockSymbol}`);
          console.log(`Action: ${order.action}`);
          console.log(`Order Type: ${order.orderType}`);
          console.log(`Quantity: ${order.quantity}`);
          console.log(`Status: ${order.status}`);
          console.log("--------------------------------");

          let currentPrice;
          // Check if price is already cached
          if (stockPriceCache[order.stockSymbol]) {
            currentPrice = stockPriceCache[order.stockSymbol];
          } else {
            currentPrice = await fetchStockPrice(order.stockSymbol);
            stockPriceCache[order.stockSymbol] = currentPrice; // Cache the stock price
          }

          console.log("Current price for", order.stockSymbol, ":", currentPrice);

          let orderFilled = false;

          // Check if LIMIT or STOP LOSS conditions match
          if (order.orderType === "LIMIT") {
            if (order.action === "BUY" && order.limitPrice <= currentPrice) {
              order.status = "EXECUTED";
              order.tradedPrice = order.limitPrice;
              order.filledQuantity = order.quantity;
            } else if (
              order.action === "SELL" &&
              order.limitPrice >= currentPrice
            ) {
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
              if (funds.availableFunds < orderCost) {
                console.log(`Insufficient funds for order ${order.virtualOrderId}`);
                continue; // Skip the order if insufficient funds
              }
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
            console.log("netPositions array before find:", paperTradeData.positions.netPositions);

            // Update positions
            const existingPosition =
              paperTradeData.positions?.netPositions.find(
                (pos) => pos.stockSymbol === order.stockSymbol
              );

            console.log("existing", paperTradeData.positions.netPositions);

            if (order.action === "BUY") {
              if (existingPosition) {
                existingPosition.avgPrice =
                  (existingPosition.avgPrice * existingPosition.quantity +
                    order.tradedPrice * order.quantity) /
                  (existingPosition.quantity + order.quantity);
                existingPosition.quantity += order.quantity;
              } else {
                paperTradeData.positions.netPositions.push({
                  stockSymbol: order.stockSymbol,
                  quantity: order.quantity,
                  avgPrice: order.tradedPrice,
                  ltp: currentPrice,
                  side: "BUY",
                  realizedPnL: 0,
                  unrealizedPnL:
                    (currentPrice - order.tradedPrice) * order.quantity,
                  buyQty: order.quantity,
                  buyAvgPrice: order.tradedPrice,
                  sellQty: 0,
                  sellAvgPrice: 0,
                  productType: order.productType,
                });
              }
            } else if (order.action === "SELL") {
              if (existingPosition) {
                existingPosition.quantity -= order.quantity;
                if (existingPosition.quantity <= 0) {
                  paperTradeData.positions.netPositions =
                    paperTradeData.positions.netPositions.filter(
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
