import { useState, useEffect } from "react";
import axios from "axios";

export default function useFetchProperties() {
    const [properties, setProperties] = useState([]); 

    useEffect(() => {
        const fetchProperties = async () => {
            const userId = localStorage.getItem("userId"); 

            try {
                const response = await axios.post("http://localhost/api/properties/fetchProperties.php", {
                    user_id: userId 
                });

                if (response.data.success) {
                    setProperties(response.data.data);
                } else {
                    console.error("Failed to load properties:", response.data.message);
                }
            } catch (err) {
                console.error("Error fetching properties:", err);
            }
        };

        fetchProperties();
    }, []);

    return properties;
}