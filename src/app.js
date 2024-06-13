import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config(); 

const app = express();

const allowedOrigins =
  process.env.NODE_ENV === "development"
    ? ["https://main.d3h2blzs129gim.amplifyapp.com"]
    : ["http://localhost:5173"];

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

//routes import
import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";

//routes declaration
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

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
