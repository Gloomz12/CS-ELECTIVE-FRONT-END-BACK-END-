import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Hooks
import { BALANCE_UPDATE_EVENT } from '../hooks/updateBalance.jsx';

export default function useFetchUser() {
    const [user, setUser] = useState({});

    const fetchUserProfile = useCallback(async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            const response = await axios.post("http://localhost/api/users/profile.php", {
                user_id: userId
            });

            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    useEffect(() => {
        window.addEventListener(BALANCE_UPDATE_EVENT, fetchUserProfile);

        return () => {
            window.removeEventListener(BALANCE_UPDATE_EVENT, fetchUserProfile);
        };
    }, [fetchUserProfile]);

    return user;


}