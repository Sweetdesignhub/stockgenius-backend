import { getUserAccessToken } from "../utils/userAccessTokens";


export const userAuthMiddleware = async (req, res, next) => {
  const userId = req.user.id; // Ensure you have middleware to authenticate user and attach userId to req object
  const accessToken = await getUserAccessToken(userId);

  if (!accessToken) {
    return res.status(401).json({ error: "Access token not found" });
  }

  req.accessToken = accessToken;
  next();
};
