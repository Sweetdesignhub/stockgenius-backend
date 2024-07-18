const userAccessTokens = new Map();

export const saveUserAccessToken = (userId, accessToken) => {
  userAccessTokens.set(userId, accessToken);
};

export const getUserAccessToken = (userId) => {
  return userAccessTokens.get(userId);
};
