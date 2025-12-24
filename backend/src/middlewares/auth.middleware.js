import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT   =asyncHandler( async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if (!token) {
            throw new ApiError(401, "Access token not found. Please login to continue.");
        }
    
        const decodedAccessToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
        const user = await User.findById(decodedAccessToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "User not found. Invalid token.");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,  error?.message || "Unauthorized access.");
    }

});