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

export const getUserAndProfile = async (req, res) => {
    try {
        // Accept token from multiple sources: query params (GET), body (POST), or headers
        let token = req.query.token || req.body?.token || req.headers['x-auth-token'] || req.headers['authorization'];
        
        // If token is in Authorization header as "Bearer TOKEN", extract it
        if (token && token.startsWith('Bearer ')) {
            token = token.substring(7);
        }

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Clean token (remove quotes if present and trim whitespace)
        const cleanToken = typeof token === 'string' 
            ? token.trim().replace(/^["']|["']$/g, '') 
            : String(token).trim().replace(/^["']|["']$/g, '');

        if (!cleanToken) {
            return res.status(400).json({ message: "Token is required" });
        }

        const user = await User.findOne({ token: cleanToken });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userProfile = await Profile.findOne({ userId: user._id })
            .populate('userId', 'name email username profilePicture');

        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Return response in the format shown in the image: { "profile": {...} }
        return res.json({ profile: userProfile });

    }catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const { token, ...newUserData } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Clean token (remove quotes if present)
        const cleanToken = token.trim().replace(/^"|"$/g, '');

        const user = await User.findOne({ token: cleanToken });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if username or email already exists for a different user
        const { username, email } = newUserData;

        if (username || email) {
            const existingUser = await User.findOne({ 
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : [])
                ],
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(400).json({ message: "Username or email already exists" });
            }
        }

        // Update user fields (exclude password and token from direct update)
        const { password, ...safeUpdateData } = newUserData;
        Object.assign(user, safeUpdateData);

        await user.save();

        return res.json({ message: "User Updated" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const updateProfileData = async (req,res) =>{
    try {

    }catch (error) {
        return res.status(500).json({ message: error.message });
    }


}