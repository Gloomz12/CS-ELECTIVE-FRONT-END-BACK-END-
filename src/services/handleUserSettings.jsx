import axios from 'axios';

export const updateUserSettings = async (userId, formData) => {
    try {
        const response = await axios.post("http://localhost/api/users/handleUserSettings.php", {
            user_id: userId,
            username: formData.username,
            full_name: formData.legalName,
            phone_number: formData.phone,
            date_of_birth: formData.dob,
            address: formData.address,
            country: formData.country,
            gender: formData.gender,
            payment_methods: formData.paymentMethods
        });
        return response.data;
    } catch (error) {
        console.error("Error updating settings:", error);
        return { success: false, message: "Network error occurred." };
    }
};