import { getUserAccessToken } from "../utils/userAccessTokens.js";


export const userAuthMiddleware = async (req, res, next) => {
  const userId = req.user.id;
  const accessToken = await getUserAccessToken(userId);
  console.log(accessToken);

  if (!accessToken) {
    return res.status(401).json({ error: "Access token not found" });
  }

  req.accessToken = accessToken;
  next();
};
