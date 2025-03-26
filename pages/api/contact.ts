import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

type FormData = {
  name: string;
  email: string;
  interest: string;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, interest, message } = req.body as FormData;

    // Basic server-side validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Create a testing account with Ethereal (for development)
    // In production, replace this with your actual SMTP credentials
    const testAccount = await nodemailer.createTestAccount();

    // Create a transporter - this is the connection to the email service
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || testAccount.user,
        pass: process.env.EMAIL_PASS || testAccount.pass,
      },
    });

    // Format the email
    const emailSubject = `New Contact Form Submission: ${interest || 'General Inquiry'}`;
    const emailText = `
      Name: ${name}
      Email: ${email}
      Interest: ${interest || 'Not specified'}
      
      Message:
      ${message}
      
      Sent from: Brix.ai Contact Form
    `;
    
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Interest:</strong> ${interest || 'Not specified'}</p>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>Sent from: Brix.ai Contact Form</em></p>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"Brix.ai Form" <${process.env.EMAIL_FROM || 'contact@brix.ai'}>`,
      to: process.env.EMAIL_TO || 'recipient@example.com', // Replace with your email later
      subject: emailSubject,
      text: emailText,
      html: htmlContent,
    });

    // For development - show the test URL where the email can be viewed
    if (!process.env.EMAIL_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      // Include preview URL for development
      previewUrl: process.env.NODE_ENV === 'development' 
        ? nodemailer.getTestMessageUrl(info) 
        : null
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email' 
    });
  }
}
