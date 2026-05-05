import { useState, useEffect } from "react";
import axios from "axios";

export default function useFetchRentings() {
    const [rentings, setRentings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRentings = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.post("http://localhost/api/rentings/fetchRentings.php", {
                    user_id: userId
                });

                if (response.data.success) {
                    const formattedData = response.data.data.map(r => ({
                        id: r.id,
                        propertyId: r.property_id,
                        propertyName: r.property_name,
                        startDate: r.start_date,
                        leaseTerm: r.lease_term,
                        monthlyRate: parseFloat(r.monthly_rate),
                        monthsPending: parseInt(r.months_pending),
                        pendingPayment: parseFloat(r.pending_payment),
                        tenantId: r.tenant_id,
                        totalPaid: parseFloat(r.total_paid),
                        totalDue: parseFloat(r.total_due),
                        status: r.status,
                        imageUrl: r.image_url,
                        ownerId: r.owner_id
                    }));
                    setRentings(formattedData);
                }
            } catch (err) {
                console.error("Error fetching rentings:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadRentings();
    }, []);

    return { rentings, isLoading, setRentings };
}