import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Campus Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Email Verification OTP",
    html: `
      <h2>Your OTP Code</h2>
      <p style="font-size: 22px; font-weight: bold;">${otp}</p>
      <p>This OTP expires in 10 minutes.</p>
    `,
  });
};
