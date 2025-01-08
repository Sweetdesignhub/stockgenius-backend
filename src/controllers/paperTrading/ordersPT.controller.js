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

  try {
    const currentPrice = await fetchStockPrice(stockSymbol); // Replace with real-time price fetching logic
    const numericQuantity = Number(quantity);
    let tradedPrice = null;
    let orderStatus = "PENDING";

    if (orderType === "MARKET") {
      tradedPrice = currentPrice;
      orderStatus = "EXECUTED";
    } else if (orderType === "LIMIT") {
      if (action === "BUY" && limitPrice >= currentPrice) {
        tradedPrice = limitPrice;
        orderStatus = "EXECUTED";
      } else if (action === "SELL" && limitPrice <= currentPrice) {
        tradedPrice = limitPrice;
        orderStatus = "EXECUTED";
      }
    } else if (orderType === "STOP_LOSS" && currentPrice >= stopPrice) {
      tradedPrice = stopPrice;
      orderStatus = "EXECUTED";
    }

    let paperTradeData = await PaperTradeData.findOne({ userId });

    if (!paperTradeData) {
      paperTradeData = new PaperTradeData({
        userId,
        funds: { totalFunds: 100000, availableFunds: 100000, reservedFunds: 0 },
        orders: [],
        positions: { netPositions: [], summary: {} },
        trades: [],
        holdings: { holdings: [] },
        riskProfile: "moderate",
        currency: "INR",
      });
    }

    const { funds, positions, holdings } = paperTradeData;
    const orderCost = numericQuantity * (tradedPrice || currentPrice);

    // BUY Validation
    if (action === "BUY" && funds.availableFunds < orderCost) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds for this BUY order.",
      });
    }

    // SELL Validation: Prevent Short Selling
    if (action === "SELL") {
      const position = positions.netPositions.find(p => p.stockSymbol === stockSymbol);
      const holding = holdings.holdings.find(h => h.stockSymbol === stockSymbol);

      // Calculate total available quantity for SELL
      const availableQuantity = (position?.quantity || 0) + (holding?.quantity || 0);

      if (availableQuantity < numericQuantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient quantity to SELL. Short selling is not allowed.",
        });
      }
    }

    // Create New Order
    const newOrder = {
      stockSymbol,
      action,
      orderType,
      quantity,
      limitPrice: orderType === "LIMIT" ? limitPrice : undefined,
      filledQuantity: orderStatus === "EXECUTED" ? numericQuantity : 0,
      tradedPrice: tradedPrice || 0,
      status: orderStatus,
      productType,
      exchange,
      virtualOrderId: uuidv4(),
    };

    paperTradeData.orders.push(newOrder);

    // Handle Executed Orders
    if (orderStatus === "EXECUTED") {
      if (action === "BUY") {
        funds.availableFunds -= orderCost;

        // Update reserved funds and available funds
        funds.reservedFunds -= orderCost;

        // Update positions
        let existingPosition = positions.netPositions.find(
          pos => pos.stockSymbol === stockSymbol
        );

        if (existingPosition) {
          existingPosition.buyQty += numericQuantity;
          existingPosition.avgPrice =
            (existingPosition.avgPrice * existingPosition.quantity +
              tradedPrice * numericQuantity) /
            (existingPosition.quantity + numericQuantity);
          existingPosition.quantity += numericQuantity;
        } else {
          positions.netPositions.push({
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
          });
        }
      } else if (action === "SELL") {
        let remainingQuantityToSell = numericQuantity;

        // Deduct from positions first
        const position = positions.netPositions.find(
          pos => pos.stockSymbol === stockSymbol
        );
        if (position) {
          const sellableFromPosition = Math.min(remainingQuantityToSell, position.quantity);
          position.sellQty += sellableFromPosition;
          position.quantity -= sellableFromPosition;
          remainingQuantityToSell -= sellableFromPosition;

          if (position.quantity <= 0) {
            positions.netPositions = positions.netPositions.filter(
              pos => pos.stockSymbol !== stockSymbol
            );
          }
        }

        // Deduct remaining from holdings
        if (remainingQuantityToSell > 0) {
          const holding = holdings.holdings.find(h => h.stockSymbol === stockSymbol);
          if (holding) {
            // Proportional adjustment for investedValue
            const avgPrice = holding.investedValue / holding.quantity;
            const sellValue = remainingQuantityToSell * avgPrice;
        
            holding.quantity -= remainingQuantityToSell;
            holding.investedValue -= sellValue; // Adjust invested value proportionally
        
            if (holding.quantity <= 0) {
              holdings.holdings = holdings.holdings.filter(
                h => h.stockSymbol !== stockSymbol
              );
            }
          }
        }
        

        funds.availableFunds += orderCost; // Add the sell value to available funds
      }

      // Add New Trade
      const newTrade = {
        stockSymbol,
        side: action,
        quantity: numericQuantity,
        price: tradedPrice,
        tradeValue: orderCost,
        tradeNumber: uuidv4(),
        orderType,
        productType,
        fees: 0, // Optional: Add fees if needed
      };
      paperTradeData.trades.push(newTrade);

      paperTradeData.positions.summary = updatePositionSummary(positions);
    }

    await paperTradeData.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: paperTradeData,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
