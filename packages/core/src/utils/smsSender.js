// src/utils/smsSender.js
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Sends an SMS message using Twilio
 * @param {string} to - The recipient's phone number
 * @param {string} message - The SMS message content
 * @returns {Promise<void>}
 */
const sendSms = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      to,
      from: twilioPhoneNumber,
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

// sendSms('+15103029703', "Hey from nodejs server")
module.exports = { sendSms };
