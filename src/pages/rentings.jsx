import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// HOOKS
import useFetchRentings from '../hooks/fetchRentings.jsx';
import useManageLeasePendings from '../hooks/useManageLeasePendings'; 

export default function Rentings() {
    const navigate = useNavigate();
    const { rentings, isLoading } = useFetchRentings();

    const normalizedRentings = useMemo(() => {
        if (!rentings || rentings.length === 0) return [];
        return rentings.map(r => ({
            ...r, 
            id: r.id,
            propertyName: r.propertyName || r.property_name,
            startDate: r.startDate || r.start_date,
            monthlyRate: parseFloat(r.monthlyRate || r.monthly_rate || 0),
            totalPaid: parseFloat(r.totalPaid || r.total_paid || 0),
            leaseTerm: parseInt(r.leaseTerm || r.lease_term || 0, 10),
            totalDue: parseFloat(r.totalDue || r.total_due || 0),
            unitOccupancy: r.unitOccupancy || r.unit_occupancy,
            imageUrl: r.imageUrl || r.image_url
        }));
    }, [rentings]);

    const processedRentings = useManageLeasePendings(normalizedRentings);

    const rentingsWithUI = useMemo(() => {
        return processedRentings.map(r => {
            const isFullyPaid = r.totalPaid >= r.totalDue && r.totalDue > 0;

            let liveStatus = r.calculatedStatus || "Up to date";
            let statusClass = "rentings-badge-uptodate";

            if (isFullyPaid) {
                liveStatus = "Fully Paid";
                statusClass = "rentings-badge-fullypaid";
            } else if (r.calculatedStatus === 'Pending') {
                liveStatus = "Overdue";
                statusClass = "rentings-badge-pending";
            } else if (r.calculatedStatus === 'Advanced payment') {
                liveStatus = "Advance Paid";
                statusClass = "rentings-badge-advance";
            }

            return {
                ...r,
                isFullyPaid,
                liveStatus,
                statusClass
            };
        });
    }, [processedRentings]);

    if (isLoading) {
        return <div className="rentings-wrapper"><p>Loading rentings...</p></div>;
    }

    return (
        <div className="page-layout">
            <div className="page-main">
                <div className="page-content">
                    <div className="rentings-wrapper">
                        <h1 className="rentings-title">My Rentings</h1>

                        {rentingsWithUI.length === 0 ? (
                            <div className="rentings-empty">
                                You are not currently renting any properties.
                            </div>
                        ) : (
                            <div className="rentings-grid">
                                {rentingsWithUI.map(renting => (
                                    <div
                                        key={renting.id}
                                        className="rentings-card"
                                        onClick={() => navigate(
                                            `/main/leasing-information/${encodeURIComponent(renting.propertyName.toLowerCase().replace(/\s+/g, '-'))}`,
                                            { state: { renting } }
                                        )}
                                    >
                                        <div className="rentings-card-image-wrap">
                                            <img
                                                src={renting.imageUrl || "/placeholder.jpg"}
                                                alt="Property"
                                                className="rentings-card-img"
                                            />
                                        </div>
                                        <div className="rentings-card-content">
                                            <div className="rentings-card-header">
                                                <h3 className="rentings-card-title">{renting.propertyName}</h3>
                                                <span className={`rentings-badge ${renting.statusClass}`}>
                                                    {renting.liveStatus}
                                                </span>
                                            </div>
                                            
                                            <p className="rentings-card-subtitle">
                                                Lease Term: {renting.leaseTerm} months • Started {renting.startDate}
                                            </p>
                                            <p className="rentings-card-subtitle">
                                                Room Occupancy: {renting.unitOccupancy}
                                            </p>

                                            <div className="rentings-rates-row">
                                                <div className="rentings-rate-box rentings-rate-normal">
                                                    <p className="rentings-rate-label">Monthly Rate</p>
                                                    <p className="rentings-rate-value">
                                                        ₱{renting.monthlyRate.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className={`rentings-rate-box ${
                                                    renting.isFullyPaid ? 'rentings-rate-fullypaid' : 
                                                    renting.calculatedMonthsPending > 0 ? 'rentings-rate-danger' : 'rentings-rate-success'
                                                }`}>
                                                    <p className="rentings-rate-label">
                                                        {renting.isFullyPaid ? 'Contract Status' : 
                                                         renting.calculatedMonthsPending > 0 ? `Amount Due (${renting.calculatedMonthsPending} mo)` : 'Balance'}
                                                    </p>
                                                    <p className="rentings-rate-value">
                                                        {renting.isFullyPaid ? 'Fully Paid' : `₱${(renting.calculatedPendingPayment || 0).toLocaleString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}