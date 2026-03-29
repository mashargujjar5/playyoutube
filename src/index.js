import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
require("dotenv").config();
import connectDB from "./db/Dbconfig.js";


const app = express();
connectDB();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use( cookieParser())





app.get('/', (req, res) => {
  res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});