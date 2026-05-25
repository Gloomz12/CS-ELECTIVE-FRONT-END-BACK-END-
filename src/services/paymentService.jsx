import axios from 'axios';

const API_BASE_URL = '';

export const PaymentService = {
    processPropertyPayment: async (paymentData) => {
        try {
            const response = await axios.post(`http://localhost/api-CS-Elective/rentings/processPayment.php`, paymentData);
            console.log("payment success")
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