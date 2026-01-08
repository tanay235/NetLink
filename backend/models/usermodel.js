import e from "express";
import mongoose, { Schema } from "mongoose";
import { use } from "react";

const UserSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    active:{
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture:{
        type: String,
        default: 'default.jpg'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tokens: {
        type: string,
        default: ''
    }
});


const User = mongoose.model("User", UserSchema);
export default User;
