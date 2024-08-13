// import jwt from 'jsonwebtoken';

// export const generateToken = (user, res) => {
//   const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//     expiresIn: '24h' 
//   });
//   console.log("token generates", token);
  

//   const expiryDate = new Date(Date.now() + 3600000);

//   const { password, ...rest } = user._doc;

//   res
//     .cookie("access_token", token, {
//       httpOnly: true,
//       expires: expiryDate,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'None', 
//     })
//     .status(200)
//     .json(rest);
// };

import jwt from 'jsonwebtoken';

export const generateToken = (user, res) => {
  try {
    // Generate the JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h', // Token expiration time
    });
    // console.log("Token generated:", token);

    // Set cookie expiry date (24 hours)
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Exclude password from user data
    const { password, ...rest } = user._doc;

    // Set the cookie and send the response
    res
      .cookie("access_token", token, {
        httpOnly: true, // Ensures cookie is sent only via HTTP(S)
        expires: expiryDate, // Cookie expiration date
        secure: true, // Secure cookies in production
        // sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'None', // Allow cross-origin cookies in development
      })
      .status(200)
      .json(rest);
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


