
// Send email otp template

export const sendEmailOtpTemplate = (otp) => { 
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:0; background-color:#0f0f1a; font-family: Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e; border-radius:16px; overflow:hidden; max-width:500px; width:100%;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding: 36px 40px 28px; background-color:#1a1a2e; border-bottom: 1px solid #2a2a4a;">
                <div style="background-color:#6c63ff; width:52px; height:52px; border-radius:14px; display:inline-block; line-height:52px; text-align:center; font-size:26px; font-weight:800; color:#ffffff; margin-bottom:14px;">
                  T
                </div>
                <br>
                <span style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.5px;">Tether</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 36px 40px 20px;">
                <p style="color:#a0a0c0; font-size:15px; margin:0 0 8px 0;">Hello 👋</p>
                <p style="color:#ffffff; font-size:16px; font-weight:600; margin:0 0 24px 0;">
                  Your verification code for Tether is:
                </p>

                <!-- OTP Box -->
                <div style="background-color:#0f0f23; border:1px solid #6c63ff; border-radius:12px; padding:28px; text-align:center; margin-bottom:24px;">
                  <span style="color:#6c63ff; font-size:42px; font-weight:800; letter-spacing:12px;">
                    ${otp}
                  </span>
                </div>

                <p style="color:#a0a0c0; font-size:13px; margin:0 0 8px 0;">
                  ⏰ This code will expire in <strong style="color:#ffffff;">10 minutes</strong>
                </p>
                <p style="color:#a0a0c0; font-size:13px; margin:0;">
                  🔒 Do not share this code with anyone
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 40px;">
                <div style="height:1px; background-color:#2a2a4a;"></div>
              </td>
            </tr>

            <!-- Warning -->
            <tr>
              <td style="padding: 20px 40px;">
                <div style="background-color:#2a1a1a; border-left:3px solid #ff6b6b; border-radius:6px; padding:12px 16px;">
                  <p style="color:#ff9a9a; font-size:12px; margin:0;">
                    ⚠️ If you did not request this, please ignore this email and secure your account immediately.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px 40px 32px;">
                <p style="color:#555577; font-size:12px; margin:0;">
                  © 2025 Tether. Made with ❤️ in India
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

export const sendWelcomeEmailTemplate = (firstName) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:0; background-color:#0f0f1a; font-family: Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e; border-radius:16px; overflow:hidden; max-width:500px; width:100%;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding: 36px 40px 28px; background-color:#1a1a2e; border-bottom: 1px solid #2a2a4a;">
                <div style="background-color:#6c63ff; width:52px; height:52px; border-radius:14px; display:inline-block; line-height:52px; text-align:center; font-size:26px; font-weight:800; color:#ffffff; margin-bottom:14px;">
                  T
                </div>
                <br>
                <span style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.5px;">Tether</span>
              </td>
            </tr>

            <!-- Hero Section -->
            <tr>
              <td align="center" style="padding: 40px 40px 20px;">
                <div style="font-size:48px; margin-bottom:16px;">🎉</div>
                <h1 style="color:#ffffff; font-size:24px; font-weight:800; margin:0 0 10px 0;">
                  Welcome to Tether!
                </h1>
                <p style="color:#a0a0c0; font-size:15px; margin:0;">
                  Hey <strong style="color:#6c63ff;">${firstName}</strong>! You are now part of the Tether family.
                </p>
              </td>
            </tr>

            <!-- Features -->
            <tr>
              <td style="padding: 20px 40px;">

                <!-- Feature 1 -->
                <div style="background-color:#0f0f23; border-radius:12px; padding:16px 20px; margin-bottom:12px;">
                  <div style="display:inline-block; background-color:#1a1a3a; border-radius:10px; padding:10px; margin-right:16px; vertical-align:middle;">
                    <span style="font-size:22px;">💬</span>
                  </div>
                  <div style="display:inline-block; vertical-align:middle;">
                    <p style="color:#ffffff; font-size:14px; font-weight:600; margin:0 0 4px 0;">Real-time Messaging</p>
                    <p style="color:#a0a0c0; font-size:12px; margin:0;">Connect with your contacts instantly</p>
                  </div>
                </div>

                <!-- Feature 2 -->
                <div style="background-color:#0f0f23; border-radius:12px; padding:16px 20px; margin-bottom:12px;">
                  <div style="display:inline-block; background-color:#1a1a3a; border-radius:10px; padding:10px; margin-right:16px; vertical-align:middle;">
                    <span style="font-size:22px;">📱</span>
                  </div>
                  <div style="display:inline-block; vertical-align:middle;">
                    <p style="color:#ffffff; font-size:14px; font-weight:600; margin:0 0 4px 0;">App + Web</p>
                    <p style="color:#a0a0c0; font-size:12px; margin:0;">Use Tether on both phone and browser</p>
                  </div>
                </div>

                <!-- Feature 3 -->
                <div style="background-color:#0f0f23; border-radius:12px; padding:16px 20px; margin-bottom:12px;">
                  <div style="display:inline-block; background-color:#1a1a3a; border-radius:10px; padding:10px; margin-right:16px; vertical-align:middle;">
                    <span style="font-size:22px;">🔒</span>
                  </div>
                  <div style="display:inline-block; vertical-align:middle;">
                    <p style="color:#ffffff; font-size:14px; font-weight:600; margin:0 0 4px 0;">Secure & Private</p>
                    <p style="color:#a0a0c0; font-size:12px; margin:0;">Your privacy is our top priority</p>
                  </div>
                </div>

                <!-- Feature 4 -->
                <div style="background-color:#0f0f23; border-radius:12px; padding:16px 20px;">
                  <div style="display:inline-block; background-color:#1a1a3a; border-radius:10px; padding:10px; margin-right:16px; vertical-align:middle;">
                    <span style="font-size:22px;">📸</span>
                  </div>
                  <div style="display:inline-block; vertical-align:middle;">
                    <p style="color:#ffffff; font-size:14px; font-weight:600; margin:0 0 4px 0;">Stories & Status</p>
                    <p style="color:#a0a0c0; font-size:12px; margin:0;">Share your moments with everyone</p>
                  </div>
                </div>

              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td align="center" style="padding: 24px 40px;">
                <a href="#" style="background-color:#6c63ff; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:14px 40px; border-radius:10px; display:inline-block; letter-spacing:0.5px;">
                  Get Started 🚀
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 40px;">
                <div style="height:1px; background-color:#2a2a4a;"></div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 24px 40px 32px;">
                <p style="color:#555577; font-size:12px; margin:0 0 8px 0;">
                  Need help? Reach out to us
                </p>
                <a href="mailto:support@tether.com" style="color:#6c63ff; font-size:12px; text-decoration:none;">
                  support@tether.com
                </a>
                <p style="color:#555577; font-size:11px; margin:16px 0 0 0;">
                  © 2025 Tether. Made with ❤️ in India
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
  </html>
  `
}