import jwt from 'jsonwebtoken';

export const generateToken = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const expiryDate = new Date(Date.now() + 3600000); // 1 hour

  const { password, ...rest } = user._doc;

  res
    .cookie("access_token", token, { httpOnly: true, expires: expiryDate })
    .status(200)
    .json(rest);
};
