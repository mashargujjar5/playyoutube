import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/Dbconfig.js";
import router from "./routes/Userroutes.js";


const app = express();
connectDB();
app.use(express.json());

app.use(cors());
app.use(router);
app.use(express.urlencoded({ extended: true }));
app.use( cookieParser())


//routes
app.use("/api/user", router);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});