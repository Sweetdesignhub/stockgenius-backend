import { v4 as uuidv4 } from "uuid";
import { fetchStockPrice } from "../../utils/yahooFinance.js";
import PaperTradeData from "../../models/paperTrading/paperTrading.model.js";

const updatePositionSummary = (positions) => {
  let totalCount = 0;
  let openCount = 0;
  let realizedPnL = 0;
  let unrealizedPnL = 0;
  let totalPnL = 0;

  // Iterate through netPositions to calculate summary values
  positions.netPositions.forEach((position) => {
    totalCount += 1; // Each position counts as 1
    if (position.quantity > 0) {
      openCount += 1; // Increment openCount if the position is still open
    }

    // Unrealized PnL (current value - average price)
    unrealizedPnL += position.quantity * (position.ltp - position.avgPrice);

    // For realized PnL, calculate it when positions are sold.
    // For simplicity, assume no closed positions here, you can add additional logic based on your specific conditions
    if (position.sellQty > 0) {
      realizedPnL +=
        position.sellQty * (position.sellAvgPrice - position.buyAvgPrice);
    }
  });

  totalPnL = realizedPnL + unrealizedPnL;

  return {
    totalCount,
    openCount,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
  };
};

export const placeOrder = async (req, res) => {
  const userId = req.params.userId;
  console.log("user", userId);

  const {
    stockSymbol,
    action,
    orderType,
    quantity,
    limitPrice,
    stopPrice,
    productType,
    exchange,
  } = req.body;

  console.log("Received order details:", req.body);

  try {
    // 1. Fetch Real-time Stock Price (Placeholder value, replace with actual fetching logic)
    const currentPrice = await fetchStockPrice(stockSymbol); // Replace with actual real-time price fetching logic
    console.log("CURRENT", currentPrice);

    const numericQuantity = Number(quantity);
    let tradedPrice = null;
    let orderStatus = "PENDING";

    // 2. Determine Traded Price and Order Status
    
    if (orderType === "MARKET") {
      // For MARKET orders, the traded price is the current market price
      tradedPrice = currentPrice;
      orderStatus = "EXECUTED";
    } else if (orderType === "LIMIT") {
      if (action === "BUY" && limitPrice <= currentPrice) {
        // For BUY LIMIT orders, the order will execute if the limit price is less than or equal to the current price
        tradedPrice = limitPrice;
        orderStatus = "EXECUTED";
      } else if (action === "SELL" && limitPrice >= currentPrice) {
        // For SELL LIMIT orders, the order will execute if the limit price is greater than or equal to the current price
        tradedPrice = limitPrice;
        orderStatus = "EXECUTED";
      } else {
        // If the limit order conditions are not met, it remains pending
        orderStatus = "PENDING";
      }
    } else if (orderType === "STOP_LOSS" && stopPrice <= currentPrice) {
      // For STOP_LOSS orders, the order will execute if the current price is greater than or equal to the stop price
      tradedPrice = stopPrice;
      orderStatus = "EXECUTED";
    } else {
      // If none of the conditions match, the order remains pending
      orderStatus = "PENDING";
    }

    // 3. Fetch or Create PaperTradeData
    let paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      // If PaperTradeData does not exist, create it
      paperTradeData = new PaperTradeData({
        userId,
        funds: {
          totalFunds: 100000, // initial total funds (can be adjusted)
          availableFunds: 100000, // initial available funds (can be adjusted)
          reservedFunds: 0,
        },
        orders: [],
        positions: {
          netPositions: [], // Array of individual net positions
          summary: {}, // Overall position summary
        },
        trades: [],
        riskProfile: "moderate",
        currency: "INR",
      });
    }

    const { funds,positions } = paperTradeData;
    const orderCost =
      quantity * (tradedPrice || limitPrice || stopPrice || currentPrice);

    // // 4. Check Available Funds for BUY Orders
    // if (action === "BUY" && orderStatus === "PENDING") {
    //   if (funds.availableFunds < orderCost) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Insufficient funds to place this order",
    //     });
    //   }
    //   funds.availableFunds -= orderCost;
    //   funds.reservedFunds += orderCost;
    // }

        // Check sufficient funds for BUY orders
        if (action === "BUY" && funds.availableFunds < orderCost) {
          return res.status(400).json({
            success: false,
            message: "Insufficient funds to place this BUY order.",
          });
        }
    
        // Check for short-sell restrictions
        if (action === "SELL") {
          const existingNetPosition = positions.netPositions.find(
            (pos) => pos.stockSymbol === stockSymbol
          );
    
          if (!existingNetPosition || existingNetPosition.quantity < numericQuantity) {
            return res.status(400).json({
              success: false,
              message:
                "Short-selling is not allowed, or you don't have enough holdings to sell.",
            });
          }
        }

    // 5. Create New Order
    const newOrder = {
      stockSymbol,
      action,
      orderType,
      quantity,
      limitPrice: orderType === "LIMIT" ? limitPrice : undefined,
      filledQuantity: orderStatus === "EXECUTED" ? quantity : 0,
      tradedPrice: tradedPrice || 0,
      status: orderStatus,
      productType,
      exchange,
      virtualOrderId: uuidv4(),
    };

    paperTradeData.orders.push(newOrder);

    // 6. Update Funds, Trades, and Positions Schema (only if order is EXECUTED)
    if (orderStatus === "EXECUTED") {
      // Update reserved and available funds
      if (action === "BUY") {
        funds.reservedFunds -= orderCost;
        funds.availableFunds -= orderCost;
      } else if (action === "SELL") {
        funds.availableFunds += orderCost; // Add the sell value to available funds
      }

      // Create New Trade
      const newTrade = {
        stockSymbol,
        side: action,
        quantity,
        price: tradedPrice,
        tradeValue: orderCost,
        tradeNumber: uuidv4(),
        orderType,
        productType,
        fees: 0, // You can calculate fees if needed
      };
      paperTradeData.trades.push(newTrade);

      // Ensure positions exists and netPositions is an array
      if (!paperTradeData.positions) {
        paperTradeData.positions = [];
      }

      // Check if position already exists
      let existingNetPosition = paperTradeData.positions.netPositions.find(
        (pos) => pos.stockSymbol === stockSymbol
      );

      const numericQuantity = Number(quantity);

      if (existingNetPosition) {
        if (action === "BUY") {
          // Update existing position for BUY
          existingNetPosition.buyQty += numericQuantity;
          existingNetPosition.buyAvgPrice =
            (existingNetPosition.buyAvgPrice * existingNetPosition.buyQty +
              tradedPrice * numericQuantity) /
            (existingNetPosition.buyQty + numericQuantity);
          existingNetPosition.quantity += numericQuantity;
        } else if (action === "SELL") {
          const prevQuantity = existingNetPosition.quantity;

          existingNetPosition.sellQty += numericQuantity;
          existingNetPosition.sellAvgPrice =
            (existingNetPosition.sellAvgPrice * existingNetPosition.sellQty +
              tradedPrice * numericQuantity) /
            (existingNetPosition.sellQty + numericQuantity);
          existingNetPosition.quantity -= numericQuantity;

          // Calculate realized PnL for closing positions
          if (prevQuantity > 0) {
            const closingQty = Math.min(numericQuantity, prevQuantity);
            const pnl = (tradedPrice - existingNetPosition.buyAvgPrice) * closingQty;
            existingNetPosition.realizedPnL += pnl;
          }

          // Handle short position if quantity becomes negative
          if (existingNetPosition.quantity < 0) {
            existingNetPosition.side = "SELL";
            existingNetPosition.unrealizedPnL =
              (existingNetPosition.sellAvgPrice - currentPrice) *
              Math.abs(existingNetPosition.quantity);
          }
        }
      } else if (action === "BUY") {
        // No existing position; create a new one for BUY
        const newNetPosition = {
          stockSymbol,
          exchange,
          quantity: numericQuantity,
          avgPrice: tradedPrice,
          ltp: currentPrice,
          side: "BUY",
          realizedPnL: 0,
          unrealizedPnL: (currentPrice - tradedPrice) * numericQuantity,
          buyQty: numericQuantity,
          buyAvgPrice: tradedPrice,
          sellQty: 0,
          sellAvgPrice: 0,
          productType,
        };
        paperTradeData.positions.netPositions.push(newNetPosition);
      } 

      //check holdings, if stock is present then only sell 
      
      // else if (action === "SELL") {
      //   // Create a new short position for SELL
      //   const newNetPosition = {
      //     stockSymbol,
      //     exchange,
      //     quantity: -numericQuantity,
      //     avgPrice: tradedPrice,
      //     ltp: currentPrice,
      //     side: "SELL",
      //     realizedPnL: 0,
      //     unrealizedPnL: (tradedPrice - currentPrice) * numericQuantity,
      //     buyQty: 0,
      //     buyAvgPrice: 0,
      //     sellQty: numericQuantity,
      //     sellAvgPrice: tradedPrice,
      //     productType,
      //   };
      //   paperTradeData.positions.netPositions.push(newNetPosition);
      // }
    

      // Update the summary after adding the new position
      paperTradeData.positions.summary = updatePositionSummary(
        paperTradeData.positions
      );
    }

    // 7. Save Updated Data
    await paperTradeData.save();

    // 8. Return Updated Response
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        funds: paperTradeData.funds,
        positions: [
          {
            netPositions: paperTradeData.positions.netPositions,
            summary: paperTradeData.positions.summary,
          },
        ],
        trades: paperTradeData.trades,
      },
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const modifyOrder = async (req, res) => {
  const { userId, orderId } = req.params;
  const { quantity, limitPrice, stopPrice } = req.body;

  try {
    // Find the paper trade data
    const paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "No paper trading data found for this user",
      });
    }

    // Find the specific order
    const orderIndex = paperTradeData.orders.findIndex(
      (order) => order._id.toString() === orderId
    );

    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = paperTradeData.orders[orderIndex];

    // Only allow modification if the order status is PENDING
    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only orders with PENDING status can be modified",
      });
    }

    // Update fields if provided
    if (quantity) order.quantity = quantity;
    if (limitPrice) order.limitPrice = limitPrice;
    if (stopPrice) order.stopPrice = stopPrice;

    // Save the updated document
    await paperTradeData.save();

    res.status(200).json({
      success: true,
      message: "Order modified successfully",
      updatedOrder: order,
    });
  } catch (error) {
    console.error("Error modifying order:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find paper trading data for the user
    const paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      return res.status(404).json({
        success: false,
        message: "No paper trading data found for this user",
      });
    }

    res.status(200).json({
      success: true,
      orders: paperTradeData.orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
