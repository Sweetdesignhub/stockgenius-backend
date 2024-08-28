import User from '../models/user.js';

export const validateAutoTradeBot = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.autoTradeBot) {
      return res
        .status(403)
        .json({ error: 'User is not authorized for auto trading' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
