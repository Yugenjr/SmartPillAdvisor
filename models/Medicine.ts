import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicine extends Document {
  userId: string;
  name: string;
  company?: string;
  dosage: string;
  price?: number;
  frequency?: string;
  duration?: number;
  condition?: string;
  severity?: string;
  expiryDate?: Date;
  purchaseDate?: Date;
  code?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  dosage: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['daily', 'twice daily', 'three times daily', 'four times daily', 'weekly', 'as needed'],
    default: 'daily'
  },
  duration: {
    type: Number, // in days
    min: 1
  },
  condition: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'moderate'
  },
  expiryDate: {
    type: Date
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  code: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'medicines'
});

// Indexes for better query performance
MedicineSchema.index({ userId: 1, name: 1 });
MedicineSchema.index({ userId: 1, createdAt: -1 });
MedicineSchema.index({ userId: 1, expiryDate: 1 });

export default mongoose.models.Medicine || mongoose.model<IMedicine>('Medicine', MedicineSchema);
