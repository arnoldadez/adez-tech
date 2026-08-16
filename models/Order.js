import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, required: true },
  platform: { type: String, required: true },
  quantity: { type: Number, required: true },
  link: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  mpesaTransactionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', OrderSchema);
