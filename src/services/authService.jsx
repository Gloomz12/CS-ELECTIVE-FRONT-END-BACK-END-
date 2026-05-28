import axios from "axios";
import useFetchUser from "./useFetchUser";

export const loginAndFetchProfile = async (email, password) => {
    try {
        const loginResponse = await axios.post("http://localhost/api-CS-Elective/auth/login.php", {
            email: email,
            password: password
        });

        if (loginResponse.data.success) {
            localStorage.setItem("userId", loginResponse.data.user_id);

            const userProfile = await useFetchUser();

            return {
                success: true,
                message: "Logged in successfully",
                user_id: loginResponse.data.user_id,
                profile: userProfile
            };
        } else {
            return {
                success: false,
                message: loginResponse.data.message || "Invalid credentials"
            };
        }
    } catch (err) {
        console.error("Login flow error:", err);
        return {
            success: false,
            message: "A network or server error occurred."
        };
    }
};