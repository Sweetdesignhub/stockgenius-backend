import jwt from 'jsonwebtoken';

export const cookieOption = {
  maxAge: 1000 * 60 ,
  sameSite: 'none',
  httpOnly: true,
  secure: true,
};

export const generateToken = (user, res) => {
  // const expiryDate = new Date(Date.now() + 3600000); 
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {expiresIn:"30s" } );

  const { password, ...rest } = user._doc;

  res
    .cookie("access_token", token,cookieOption)
    .status(200)
    .json(rest);
};
