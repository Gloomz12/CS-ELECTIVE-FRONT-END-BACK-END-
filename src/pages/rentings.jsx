import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// HOOKS
import useFetchRentings from '../hooks/fetchRentings.jsx';

export default function Rentings() {
    const navigate = useNavigate();
    const { rentings, isLoading } = useFetchRentings();

    const processedRentings = useMemo(() => {
        if (!rentings) return [];

        return rentings.map(r => {
            const startDateObj = new Date(r.startDate);
            const currentDateObj = new Date();
            const monthlyRate = parseFloat(r.monthlyRate || 0);
            const totalPaid = parseFloat(r.totalPaid || 0);
            console.log(r)
            let monthsElapsed = (currentDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + (currentDateObj.getMonth() - startDateObj.getMonth());

            if (currentDateObj.getDate() < startDateObj.getDate()) {
                monthsElapsed--;
            }
            monthsElapsed = Math.max(0, monthsElapsed);
            console.log(monthsElapsed)

            const monthsCoveredByPayment = monthlyRate > 0 ? Math.floor(totalPaid / monthlyRate) : 0;

            const calculatedMonthsPending = monthsElapsed - monthsCoveredByPayment;
            const calculatedPendingPayment = calculatedMonthsPending * monthlyRate;

            let statusLabel = "Up to Date";
            let statusClass = "rentings-badge-uptodate";

            if (calculatedMonthsPending > 0) {
                statusLabel = "Overdue";
                statusClass = "rentings-badge-pending";
            } else if (calculatedMonthsPending < 0) {
                statusLabel = "Advance Paid";
                statusClass = "rentings-badge-advance";
            }

            return {
                ...r,
                monthsPending: calculatedMonthsPending,
                pendingPayment: Math.max(0, calculatedPendingPayment),
                liveStatus: statusLabel,
                statusClass: statusClass
            };
        });
    }, [rentings]);

    if (isLoading) {
        return <div className="rentings-wrapper"><p>Loading rentings...</p></div>;
    }

    return (
        <div className="page-layout">
            <div className="page-main">
                <div className="page-content">
                    <div className="rentings-wrapper">
                        <h1 className="rentings-title">My Rentings</h1>

                        {processedRentings.length === 0 ? (
                            <div className="rentings-empty">
                                You are not currently renting any properties.
                            </div>
                        ) : (
                            <div className="rentings-grid">
                                {processedRentings.map(renting => (
                                    <div
                                        key={renting.id}
                                        className="rentings-card"
                                        onClick={() => navigate(
                                            `/main/leasing-information/${encodeURIComponent((renting.propertyName || renting.property_name).toLowerCase().replace(/\s+/g, '-'))}`,
                                            { state: { renting } }
                                        )}
                                    >
                                        <div className="rentings-card-image-wrap">
                                            <img
                                                src={renting.imageUrl || renting.image_url || "/placeholder.jpg"}
                                                alt="Property"
                                                className="rentings-card-img"
                                            />
                                        </div>
                                        <div className="rentings-card-content">
                                            <div className="rentings-card-header">
                                                <h3 className="rentings-card-title">{renting.propertyName || renting.property_name}</h3>
                                                <span className={`rentings-badge ${renting.statusClass}`}>
                                                    {renting.liveStatus}
                                                </span>
                                            </div>
                                            <p className="rentings-card-subtitle">
                                                Lease Term: {renting.leaseTerm || renting.lease_term} months • Started {renting.startDate || renting.start_date}
                                            </p>

                                            <div className="rentings-rates-row">
                                                <div className="rentings-rate-box rentings-rate-normal">
                                                    <p className="rentings-rate-label">Monthly Rate</p>
                                                    <p className="rentings-rate-value">₱{parseFloat(renting.monthlyRate || renting.monthly_rate).toLocaleString()}</p>
                                                </div>

                                                <div className={`rentings-rate-box ${renting.monthsPending > 0 ? 'rentings-rate-danger' : 'rentings-rate-success'}`}>
                                                    <p className="rentings-rate-label">
                                                        {renting.monthsPending > 0 ? `Amount Due (${renting.monthsPending} mo)` : 'Balance'}
                                                    </p>
                                                    <p className="rentings-rate-value">
                                                        ₱{renting.pendingPayment.toLocaleString()}
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