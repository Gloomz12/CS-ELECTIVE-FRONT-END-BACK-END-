import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Hooks
import { useListenBalanceUpdate } from './updateBalance.jsx';

export default function useFetchUser() {
    const [user, setUser] = useState({});
    
    const fetchUserProfile = useCallback(async () => {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await axios.post("http://localhost/api/users/profile.php", {
                user_id: userId
            });

            if (response.data.success) {
                setUser(response.data.data);
                console.log("User data updated:", response.data.data);
            } else {
                console.error("Failed to load user:", response.data.message);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    useListenBalanceUpdate(fetchUserProfile);

    return user;
}