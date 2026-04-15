import api from './api';

// Types
export interface PaymentOrder {
  id: string;
  currency: string;
  amount: number;
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export interface Payment {
  _id: string;
  user: string;
  course: string | {
    _id: string;
    title: string;
    price: number;
    thumbnail: string;
  };
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amount: number;
  status: 'pending' | 'successful' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentVerificationData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  courseId: string;
}

// Payment services
const paymentService = {
  // Create order for payment
  createOrder: async (courseId: string): Promise<PaymentOrder> => {
    const response = await api.post('/payments/create-order', { courseId });
    return response.data;
  },

  // Verify payment after successful transaction
  verifyPayment: async (paymentData: PaymentVerificationData): Promise<{ success: boolean; payment: Payment; message: string }> => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  // Get payment history for logged in user
  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  // Get payment details by ID
  getPaymentById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Get all payments (admin only)
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/admin');
    return response.data;
  },
};

export default paymentService;