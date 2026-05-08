import { useState, useEffect } from "react";
import axios from "axios";

export default function useFetchTenants(propertyId) {
    const [tenants, setTenants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTenants = async () => {
            if (!propertyId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.post("http://localhost/api/tenants/fetchTenants.php", {
                    property_id: propertyId
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
                        totalDue: parseFloat(t.total_due)
                    }));
                    setTenants(formattedData);
                }
            } catch (err) {
                console.error("Error fetching tenants:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadTenants();
    }, [propertyId]);

    return { tenants, isLoading, setTenants };
}