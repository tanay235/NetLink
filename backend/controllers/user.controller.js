import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import Profile from "../models/profile.model.js";
import crypto from "crypto";

export const register = async (req, res) => {
    try {

        const { name, email, password, username } = req.body;
        if (!name || !email || !password || !username) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            username
        });

        await newUser.save();

        const profile = new Profile({ userId: newUser._id });
        await profile.save();
        return res.json({ message: "User Created" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = crypto.randomBytes(64).toString('hex');
        await User.updateOne({ _id: user._id }, { token });
        await user.save();
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const uploadProfilePicture = async (req, res) => {
    const { token } = req.body;
    try { 
        const user = await User.findOne({ token:token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.profilePicture = req.file.filename;
        
        await user.save();

        return res.json({ message: "Profile picture updated successfully" });


    }catch (error) {
        return res.status(500).json({ message: error.message });
    }
}