import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(postRoutes);
app.use(express.json());
const start = async() => {
    const connectDB = await mongoose.connect("mongodb+srv://tanay235mittal_db_user:XuYN70KNomKM3v6A@netlinkcluster.vdfgwz5.mongodb.net/?appName=NetLinkCluster")
    app.listen(9080, () => {
        console.log("server is running in port 9080");
    })
}

start();