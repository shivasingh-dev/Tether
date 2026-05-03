import twilio from 'twilio'


// Twilio credentials from env
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const serviceSid = process.env.TWILIO_SERVICE_SID

const client = twilio(accountSid, authToken)

// Format phone number to E.164 format
const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned
  }

  return cleaned
}

// send otp to phone number
export const sendOtpToPhoneNumber = async (phoneNumber) => {
  console.log(phoneNumber)
  try {
    if (!phoneNumber) {
      throw new Error("phone number is required")
    } 
    const response = await client.verify.v2.services(serviceSid).verifications.create({
      to:phoneNumber,
      channel: 'sms'
    })
    console.log('Twilio response', response)
    return response
  } catch (error) {
    console.error("Error in send otp to phone number twilio", error)
    throw new Error('failed to send otp')    
  }
}

// Verify otp 
export const verifyOtp = async (phoneNumber, phoneOtp) => {
  try {
    const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
      to:phoneNumber,
      code: phoneOtp
    })
    return response
  } catch (error) {
    console.error("Error in otp verification twilio", error)
    throw new Error('otp verification failed')    
  }
}
