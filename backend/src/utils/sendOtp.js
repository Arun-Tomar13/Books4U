import nodemailer from 'nodemailer';

/**
 * Send email using Gmail
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('📧 Sending email to:', to);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `Books4U <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send email: ' + error.message);
  }
};

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get email template based on purpose
 */
const getEmailTemplate = (otp, purpose = 'Email Verification') => {
  const purposeConfig = {
    'Email Verification': {
      icon: '🔐',
      title: 'Email Verification',
      greeting: 'Thank you for registering with <strong>Account Manager</strong>!',
      message: 'Your One-Time Password (OTP) for email verification is:'
    },
    'Password Reset': {
      icon: '🔑',
      title: 'Password Reset',
      greeting: 'You requested to reset your password.',
      message: 'Your One-Time Password (OTP) to reset your password is:'
    },
    'Change Password': {
      icon: '🔒',
      title: 'Change Password',
      greeting: 'You requested to change your password.',
      message: 'Your One-Time Password (OTP) to confirm password change is:'
    }
  };

  const config = purposeConfig[purpose] || purposeConfig['Email Verification'];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${config.icon} ${config.title}</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                    Hello,
                  </p>
                  <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 30px 0;">
                    ${config.greeting}
                  </p>
                  <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
                    ${config.message}
                  </p>
                  
                  <!-- OTP Box -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 20px; display: inline-block; margin: 20px 0;">
                          <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 30px 0 20px 0;">
                    <strong style="color: #e74c3c;">⏱️ This OTP is valid for 10 minutes.</strong>
                  </p>
                  <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0;">
                    If you did not request this, please ignore this email or contact support if you're concerned.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    This is an automated email. Please do not reply.
                  </p>
                  <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
                    © 2025 Account Manager. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send OTP email with formatted HTML
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - 'Email Verification' | 'Password Reset' | 'Change Password'
 */
export const sendOTPEmail = async (email, otp, purpose = 'Email Verification') => {
  console.log(`🔐 Sending ${purpose} OTP to:`, email);
  console.log('🔢 OTP Code:', otp);
  
  const subject = `${purpose} - Account Manager`;
  const text = `Your OTP for ${purpose.toLowerCase()} is: ${otp}. This OTP is valid for 10 minutes.`;
  const html = getEmailTemplate(otp, purpose);
  
  const result = await sendEmail(email, subject, text, html);
  console.log(`✅ ${purpose} OTP email sent successfully!`);
  return result;
};

export default sendEmail;