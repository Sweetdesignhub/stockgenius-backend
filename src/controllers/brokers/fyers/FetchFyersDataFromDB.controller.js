import FyersUserDetail from "../../../models/brokers/fyers/fyersUserDetail.model.js";

// Fetch all Fyers user details for a given user ID
export const fetchAllFyersUserDetails = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetails = await FyersUserDetail.find({ userId });
    if (userDetails.length === 0)
      return res
        .status(404)
        .json({ error: "No Fyers user details found for this user" });
    res.status(200).json(userDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch funds by user ID
export const fetchFundsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetail = await FyersUserDetail.findOne({ userId }).select(
      "funds"
    );
    if (!userDetail) return res.status(404).json({ error: "User not found" });
    res.status(200).json(userDetail.funds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch holdings by user ID
export const fetchHoldingsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetail = await FyersUserDetail.findOne({ userId }).select(
      "holdings"
    );
    if (!userDetail) return res.status(404).json({ error: "User not found" });
    res.status(200).json(userDetail.holdings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch orders by user ID
export const fetchOrdersByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetail = await FyersUserDetail.findOne({ userId }).select(
      "orders"
    );
    if (!userDetail) return res.status(404).json({ error: "User not found" });
    res.status(200).json(userDetail.orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch trades by user ID
export const fetchTradesByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetail = await FyersUserDetail.findOne({ userId }).select(
      "trades"
    );
    if (!userDetail) return res.status(404).json({ error: "User not found" });
    res.status(200).json(userDetail.trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch positions by user ID
export const fetchPositionsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const userDetail = await FyersUserDetail.findOne({ userId }).select(
      "positions"
    );
    if (!userDetail) return res.status(404).json({ error: "User not found" });
    res.status(200).json(userDetail.positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
