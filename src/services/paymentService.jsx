import axios from 'axios';

const API_BASE_URL = 'http://localhost/api/rentings';

export const paymentService = {
    processPropertyPayment: async (paymentData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/processPayment.php`, paymentData);
            return response.data;
        } catch (error) {
            console.error("Payment Service Error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Connection to payment server failed."
            };
        }
    }
};