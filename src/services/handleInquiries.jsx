import axios from 'axios';

const API_URL = 'http://localhost/api-CS-Elective/inquiries';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const fetchInquiries = async () => {
    try {
        const response = await api.get('/fetchInquiries.php');
        return response.data;
    } catch (error) {
        console.error("Axios Fetch Error:", error.response?.data || error.message);
        throw error;
    }
};

export const acceptInquiry = async (inquiryData, occupancyDetails) => {
    try {
        const payload = {
            inquiry_id: inquiryData.id,
            property_id: inquiryData.propertyId,
            tenant_id: inquiryData.tenantId,
            property_name: inquiryData.propertyName,
            monthly_rate: inquiryData.monthlyRate,
            lease_term: inquiryData.leaseTerm,
            unit_occupancy: occupancyDetails
        };

        const response = await api.post('/acceptInquiry.php', payload);
        return response.data;
    } catch (error) {
        console.error("Axios Accept Error:", error.response?.data || error.message);
        return { success: false, message: error.response?.data?.message || "Server Error" };
    }
};

export const declineInquiry = async (id) => {
    try {
        const response = await api.post('/declineInquiry.php', { id });
        return response.data;
    } catch (error) {
        console.error("Axios Decline Error:", error.response?.data || error.message);
        return { success: false, message: error.response?.data?.message || "Server Error" };
    }
};