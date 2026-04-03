import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
dotenv.config();
import connectDB from "../config/Dbconfig.js";
import router from "./routes/Userroutes.js";
import productRoutes from "./routes/product.js";


const app = express();
 connectDB();
app.use(express.json());

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use( cookieParser())


//routes
app.use("/api/user", router);
app.use("/api", productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});