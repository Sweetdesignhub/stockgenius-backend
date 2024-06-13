import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/errorHandler.js";
import { generateToken } from "../utils/generateToken.js";

const clientId = 'SH4XR0GZIF-100';
const clientSecret = 'GLB8Z7TAAW'; 
const redirectUri = 'hhttps://www.google.com/';

export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const validUser = await User.findOne({ email });

    if (!validUser) {
      return next(errorHandler(404, "User not found !!"));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);

    if (!validPassword) {
      return next(errorHandler(401, "Invalid Credentials !!"));
    }

    generateToken(validUser, res);
  } catch (error) {
    next(error);
  }
};

export const googleSignin = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      generateToken(user, res);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      const newUser = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-8),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo, 
      });

      await newUser.save();

      generateToken(newUser, res);
    }
  } catch (error) {
    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('access_token').status(200).json('Signout success!');
};

export const generateFyersToken = async (req, res) => {
  try {
    const { code } = req.body;

    const response = await axios.post('https://api-t1.fyers.in/api/v3/generate-authcode', {
      client_id: clientId,
      secret_key: clientSecret,
      redirect_uri: redirectUri,
      auth_code: code,
    });

    if (response.data.s === 'ok') {
      const { access_token } = response.data;
      const user = await User.findById(req.userId);
      user.fyersToken = access_token;
      await user.save();
      res.status(200).json({ message: 'Token generated and saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to generate token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
};
