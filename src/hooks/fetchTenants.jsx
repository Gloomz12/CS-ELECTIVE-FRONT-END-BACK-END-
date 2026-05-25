import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function useFetchTenants(propertyId, currentUserId) {
    const [tenants, setTenants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenantsData = useCallback(async () => {
        if (!propertyId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost/api-CS-Elective/tenants/fetchTenants.php", {
                property_id: propertyId,
                user_id: currentUserId
            });

            if (response.data.success) {
                const formattedData = response.data.data.map(t => ({
                    id: t.id,
                    tenantName: t.tenant_name || "Unknown Tenant",
                    occupancy: t.unit_occupancy,
                    leaseTerm: t.lease_term,
                    pendingStatus: parseFloat(t.pending_payment) > 0 ? "Pending" : "Up to date",
                    pendingPayment: parseFloat(t.pending_payment),
                    totalPaid: parseFloat(t.total_paid),
                    totalDue: parseFloat(t.total_due),
                    startDate: new Date(t.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    monthlyRate: parseFloat(t.monthly_rate)
                }));
                setTenants(formattedData);
                console.log(response.data.data);
            }
        } catch (err) {
            console.error("Error fetching tenants:", err);
        } finally {
            setIsLoading(false);
        }
    }, [propertyId]);

    useEffect(() => {
        fetchTenantsData();
    }, [fetchTenantsData]);

    return {
        tenants,
        isLoading,
        setTenants,
        refetch: fetchTenantsData
    };
}