import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Otp } from "../models/otp.model.js";
// import { sendOtpEmail } from "../utils/brevoOtp.js";
import { sendOTPEmail } from "../utils/sendOtp.js";

const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findOne({_id:userId})
    
        const accessToken = user.generateAccesToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
    
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    const userExist = await User.findOne({
        $or: [{ email }]
    })

    if (userExist) {
        throw new ApiError(409, "User with email already exists")
    }

    const user = await User.create({
        name,
        email,
        password,
    })

    const createdUser = await User.findById(user._id).select("-avatar -booksBought -booksSold -booksPosted -isOnBoarded -isPhoneVerified -isEmailVerified -role -__v -createdAt -updatedAt")

    if (!createdUser) {
        throw new ApiError(500, "User registration failed")
    }

    await Otp.deleteMany({
        user: user._id,
        type: "email",
        purpose: "register",
    });
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
        user: user._id,
        identifier: email,          // email as string
        otp: otpCode,
        type: "email",
        purpose: "register",
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        isUsed: false,
    });


    const emailResponse = await sendOTPEmail(email, otpCode);
    // const emailResponse = await sendOtpEmail(name, email, otpCode, "register");

    if (!emailResponse) {
        throw new ApiError(500, "Failed to send OTP email")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully, Please verify your email with OTP"))

})

const verifyEmailOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required")
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User not found with this email")
    }

    if (user.isEmailVerified) {
        return res.status(200)
            .json(new ApiResponse(200, { isEmailVerified: true }, "Email is already verified"));
    }


    const otpRecord = await Otp.findOne({
        user: user._id,
        identifier: email,
        type: "email",
        purpose: "register",
        isUsed: false,
    }).sort({ createdAt: -1 }); // latest first

    if (!otpRecord) {
        throw new ApiError(400, "OTP not found or already used. Please request a new one.");
    }

    // 4. Check expiry
    const now = Date.now();
    if (otpRecord.expiresAt.getTime() <= now) {
        // cleanup this OTP (and optionally all others)
        await Otp.deleteMany({
            user: user._id,
            type: "email",
            purpose: "register",
        });
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }



    // 5. Compare OTP (string compare is fine, you generated it as string)
    const isMatch = await otpRecord.isOtpCorrect(otp);

    if (!isMatch) {
        throw new ApiError(401, "Invalid OTP");
    }

    // 6. Mark user as verified
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    await Otp.deleteMany({
        user: user._id,
        type: "email",
        purpose: "register"
    });

    const options = {
        httpOnly: true,
        secure: true, 
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 8. Send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: true },
                "Email verified successfully"
            )
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email, user does not exist")
    }


    if (!user.isOnBoarded) {
        throw new ApiError(401, "you are not onboarded. Please complete the onboarding process to login");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(401, "Email is not verified. Please verify your email to login");
    }

    if (!user.isPhoneVerified) {
        throw new ApiError(401, "phone number is not verified. Please verify your phone to login");
    }

    const isPasswordMatch = await user.isPasswordCorrect(password);

    if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid password")
    }

    const options = {
        httpOnly: true,
        secure: true, 
    };

    const safeUser = await User.findById(user._id).select("-password -refreshToken");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Set cookies here
    res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    user: safeUser,
                },
                "User logged in successfully"
            )
        );

});

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
    req.user._id,
    { $set:{refreshToken: undefined}},
    {new: true}
   );

   const options={
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
    new ApiResponse(200, {}, "User logged out successfully")
   )

});

const resendEmailOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({email});

    if (!user) {
        throw new ApiError(400, "User not found with this email")
    }

    if (user.isEmailVerified) {
        return res.status(200)
            .json(new ApiResponse(200, { isEmailVerified: true }, "Email is already verified"));
    }

    await Otp.deleteMany({
        user: user._id,
        type: "email",
        purpose: "register",
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create({
        user: user._id,
        identifier: email,          // email as string
        otp: otpCode,
        type: "email",
        purpose: "register",
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        isUsed: false,
    });


    const emailResponse = await sendOTPEmail(email, otpCode);
    // const emailResponse = await sendOtpEmail(name, email, otpCode, "register");

    if (!emailResponse) {
        throw new ApiError(500, "Failed to send OTP email")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "OTP sent successfully to email"))

});

const onboardingUser = asyncHandler(async (req, res) => {
    const userid = req.user._id;

    const {bio,role,phone,avatar,college,branch,startyear,endyear}= req.body;

    if(!bio || !phone || !avatar || !college || !branch || !startyear || !endyear){
        throw new ApiError(400,"All fields are required for onboarding");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userid,
        {
            ...req.body,
            isOnBoarded: true
        },
        { new: true }
    ).select("-password -refreshToken");

    if(!updatedUser){
        throw new ApiError(500,"Failed to complete onboarding");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedUser,"User onboarded successfully")
    )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

    

export {
    registerUser,
    verifyEmailOtp,
    loginUser,
    logoutUser,
    onboardingUser,
    resendEmailOtp,
    refreshAccessToken
}