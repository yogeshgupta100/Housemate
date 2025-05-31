import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

function formatToE164(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length > 10 && digits.startsWith('+' )) {
    return digits;
  }
  return `+${digits}`;
}

export const sendSMS = async (to, message) => {
  try {
    const formattedTo = formatToE164(to);
    const response = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: formattedTo
    });
    
    console.log('SMS sent successfully:', response.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

export const sendOTP = async (phone, otp) => {
  const message = `Your Housemate verification code is: ${otp}. This code will expire in 10 minutes.`;
  return sendSMS(phone, message);
}; 