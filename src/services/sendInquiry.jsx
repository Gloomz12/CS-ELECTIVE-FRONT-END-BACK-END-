import axios from "axios";

export const sendInquiry = async (inquiryData) => {
    try {
        const response = await axios.post("http://localhost/api-CS-Elective/inquiries/sendInquiry.php", inquiryData, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error sending inquiry:", error);
        return { success: false, message: "Network error occurred." };
    }
};