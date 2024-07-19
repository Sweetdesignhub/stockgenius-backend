import jwt from 'jsonwebtoken';

export const generateToken = (user, res) => {
<<<<<<< HEAD
  const token = jwt.sign({ id: user._id },process.env.JWT_SECRET);
  const expiryDate = new Date(Date.now() + 3600000); // 1 hour
=======
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  const expiryDate = new Date(Date.now() + 3600000); 
>>>>>>> 2244d670a66af829709101050f57269f0a22a052

  const { password, ...rest } = user._doc;

  res
    .cookie("access_token", token, { httpOnly: true, expires: expiryDate })
    .status(200)
    .json(rest);
};
