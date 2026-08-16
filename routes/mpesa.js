import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// Generate OAuth Token
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

// STK Push (Lipa Na M-Pesa Online)
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;
    const token = await getAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: `https://your-render-app.onrender.com/api/mpesa/callback`,
        AccountReference: `ADEZ-${orderId}`,
        TransactionDesc: 'SMM Services Payment'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ success: true, response: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Callback URL for M-Pesa
router.post('/callback', (req, res) => {
  console.log('M-Pesa Callback:', req.body);
  // Update order status here
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

export default router;
