import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";


dotenv.config();

const app = express();

const allowedOrigins =
  // process.env.NODE_ENV === "development" ? ["http://localhost:5173"]: 
 ["https://www.stockgenius.ai","https://stockgenius.ai", "https://stockgenius-frontend.vercel.app" ];
//  ["http://localhost:5173"]

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// import routes
import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import fyersRoutes from "./routes/brokers/fyers.route.js";

// Routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/fyers", fyersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[${new Date().toISOString()}] ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

export { app };
