export const deactivateAutoTradeBotCNCPaperTrading = async (req, res) => {
    const { userId } = req.params;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Stop the bot and clear the interval
      user.autoTradeBotCNC = "stopped";
      await user.save();
  
      // Clear interval for CNC mode
      if (activeIntervals.cnc[userId]) {
        console.log("Clearing interval ID for CNC:", activeIntervals.cnc[userId]);
        clearInterval(activeIntervals.cnc[userId]);
        delete activeIntervals.cnc[userId];
      }
  
      return res.status(200).json({ message: "CNC auto trade bot deactivated" });
    } catch (error) {
      console.error("Error deactivating CNC bot:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  };