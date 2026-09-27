import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { PAID_PLANS, PAYMENT_STATUSES } from '@poster/shared';

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: PAID_PLANS, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['BDT'], default: 'BDT', required: true },
    method: { type: String, enum: ['bkash'], default: 'bkash', required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', required: true },
    trxId: { type: String, unique: true, sparse: true },
    wallet: String, // masked, e.g. 017*****678
    expiresAt: { type: Date, required: true }, // checkout session deadline
    paidAt: Date,
    failedAttempts: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
paymentSchema.index({ userId: 1, createdAt: -1 });

export type Payment = InferSchemaType<typeof paymentSchema>;
export type PaymentDoc = HydratedDocument<Payment>;
export const PaymentModel = model('Payment', paymentSchema);
