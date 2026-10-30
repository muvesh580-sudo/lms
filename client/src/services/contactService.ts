import api from './api';

// Types
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  // Hidden from people; only bots fill it in
  website?: string;
}

// Contact services
const contactService = {
  // Send a message from the contact form
  sendMessage: async (data: ContactFormData): Promise<{ message: string }> => {
    const response = await api.post('/contact', data);
    return response.data;
  },
};

export default contactService;
