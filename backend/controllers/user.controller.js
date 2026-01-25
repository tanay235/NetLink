import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import Profile from "../models/profile.model.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import ConnectionRequest from "../models/connections.model.js";
import Post from "../models/postsmodel.js";



const convertUserDataToPDF = async (userData) => {
    
    const doc= new PDFDocument();

    const outputPath = crypto.randomBytes(32).toString('hex') + '.pdf';
    const stream = fs.createWriteStream("uploads/" + outputPath);

    doc.pipe(stream);

    doc.image(`uploads/${userData.userId.profilePicture}`, { align: 'center', width: 100 });

    doc.fontSize(14).text(`Name: ${userData.userId.name}`);
    doc.fontSize(14).text(`Email: ${userData.userId.email}`);
    doc.fontSize(14).text(`Username: ${userData.userId.username}`);
    doc.fontSize(14).text(`Bio: ${userData.bio}`);
    doc.fontSize(14).text(`Current Position: ${userData.currentPost}`);
    doc.fontSize(14).text("Past Work: ");
    userData.pastWork.forEach((work, index) => {
        doc.fontSize(14).text(`Company Name: ${work.company}`);
        doc.fontSize(14).text(`Position: ${work.position}`);
        doc.fontSize(14).text(`Years : ${work.years}`);

    });

    doc.end();

    return outputPath;
}


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

        const { token, ...newProfileData } = req.body;

        const  userProfile  = await User.findOne({ token: token });

        if (!userProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        const profile_to_update = await Profile.findOne({ userId: userProfile._id });

        Object.assign(profile_to_update, newProfileData);

        await profile_to_update.save();
        
        return res.json({ message: "Profile Updated" });

    }catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const getAllUserProfile = async (req ,res) =>{

    try {

        const profiles = await Profile.find().populate('userId', 'name email username profilePicture');

        return res.json({ profiles });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

}

   export const downloadProfile = async (req, res) => {

        const user_id = req.query.id;

        const userProfile = await Profile.findOne({ userId: user_id }).populate('userId', 'name email username profilePicture');

        let outputPath = await convertUserDataToPDF(userProfile);

        return res.json({ "message" : outputPath });

 }

 export const sendConnectionRequest = async (req, res) => {

    const { token, connentionId } = req.body;

    try {

        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connectionUser = await User.findById({ _id: connentionId });

        if (!connectionUser) {
            return res.status(404).json({ message: "Connection User not found" });
        }

        const existingRequest = await ConnectionRequest.findOne({ userId: user._id, connectionId: connentionId });
        
        if (existingRequest) {
            return res.status(400).json({ message: "Connection request already sent" });
        }

        const request = new ConnectionRequest({
            userId: user._id,
            connectionId: connentionId
        });
        
        await request.save();
        
        return res.json({ message: "Request Send" });

    }catch (error) {
        return res.status(500).json({ message: error.message });
    }

 }


export const getMyConnectionRequests = async (req, res) => {
    const { token } = req.body;
    
    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connections = await ConnectionRequest.find({ userId: user._id}).populate('connectionId', 'name email username profilePicture');
        
        return res.json({ connections });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const whatAreMyConnections = async (req, res) => {
    const { token } = req.body;
    
    try {
        const user = await User.findOne({ token: token });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const connections = await ConnectionRequest.find({ connectionId: user._id}).populate('userId connectionId', 'name email username profilePicture');

        return res.json(connections);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export const acceptConnectionRequest = async (req, res) => {
    const { token, requestId, action_type } = req.body;
    
    try {
        const user = await User.findOne({ token: token });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const connection = await ConnectionRequest.findOne({ _id: requestId});

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

        if (action_type === "accept") {
            connection.status_accepted = true;
        } else {
            connection.status_accepted = false;
        }

        await connection.save();

        return res.json({ message: "Request Updated" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


export const commentPost = async (req, res) => {
    
    const {token, post_id, commentBody} = req.body;

    try {
        const user = await User.findOne({ token: token }).select('_id');  
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const post = await Post.findOne({ _id: post_id});

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = new Comment({
            userId: user._id,
            postId: post._id,
            comment: commentBody
        });

        await comment.save();

        return res.status(200).json({ message: "Comment Added" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}