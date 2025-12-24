import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo";
import { ApiError } from "./ApiError.js";

const sendOtpEmail = async (name="",email,otpCode,purpose)=>{
    
    try {
        let emailAPI = new TransactionalEmailsApi();
        emailAPI.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
    
        let message = new SendSmtpEmail();
    message.subject = `${purpose} - OTP Verification`;
    message.textContent = "Your Otp code is "+otpCode;
    message.sender = { name: process.env.BREVO_SENDER_NAME , email: process.env.BREVO_SENDER_EMAIL };
    message.to = [{ email, name }];
    
      return await emailAPI.sendTransacEmail(message);
    } catch (error) {
        console.log("BREVO ERROR:", error.response?.data || error.message);
  throw new ApiError(500, "Failed to send OTP email");
    }
};

export { sendOtpEmail };