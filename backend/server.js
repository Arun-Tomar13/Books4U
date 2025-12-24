import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/utils/db.util.js";
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();

// setting cors
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static("public"));

// importing routes
import authRouter from "./src/routes/auth.route.js";
import userRouter from "./src/routes/user.route.js";

// Routes declaration
app.use("/auth",authRouter);
app.use("/user",userRouter);

const port =  process.env.PORT;

// starting server
app.listen(port,()=>{
    console.log("Server is running at port : ",port);
    connectDB();
})