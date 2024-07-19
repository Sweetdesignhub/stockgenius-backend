import dotenv from "dotenv";
dotenv.config({ path: './.env' });
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = 8080
console.log('MONGODB_URI index :', process.env.MONGODB_URI);
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
