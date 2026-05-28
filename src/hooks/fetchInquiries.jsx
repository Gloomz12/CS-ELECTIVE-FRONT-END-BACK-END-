import { useState, useEffect } from "react";
import axios from "axios";

export default function UseFetchInquiries() {
    const [inquiries, setInquiries] = useState([]);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const response = await axios.get("http://localhost/api-CS-Elective/inquiries/fetchInquiries.php");
                
                if (response.data.success) {
                    setInquiries(response.data.data);
                } else {
                    console.error("Failed to load inquiries:", response.data.message);
                }
            } catch (err) {
                console.error("Error fetching inquiries:", err);
            }
        };

        fetchInquiries();
    }, []);

    return inquiries;
}