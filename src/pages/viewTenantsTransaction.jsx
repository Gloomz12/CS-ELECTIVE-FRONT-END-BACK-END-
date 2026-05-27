import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { propertyService } from '../services/api.jsx';

export default function ViewTenantsTransaction() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const storedUserId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

    const leaseData = location.state?.leaseData || {
        id: null,
        ownerId: null,
        tenantId: null,
        tenantName: "Tenant",
        propertyName: "Property Records",
        unitOccupancy: params.occupancy?.replace(/-/g, ' ') || "N/A",
        monthlyRate: 0
    };


    const isAuthorized = useMemo(() => {
        if (!storedUserId || !leaseData.ownerId) return false;
        return String(leaseData.ownerId) === String(storedUserId);
    }, [storedUserId, leaseData.ownerId]);

    const fetchData = async () => {
        if (!isAuthorized) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const txRes = await propertyService.getFilteredTransactions(
                storedUserId,
                leaseData.unitOccupancy
            );

            console.log("Fetched Filtered Transactions:", txRes.data);
            setTransactions(txRes.data?.data || []);
            console.log(txRes.data?.data)

        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load records. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAuthorized]);

    const filteredTransactions = useMemo(() => {
        if (!Array.isArray(transactions)) return [];
        const targetOccupancy = leaseData.unitOccupancy ? String(leaseData.unitOccupancy).trim().toLowerCase() : "";
        return transactions.filter(tx => {
            const txOccupancy = tx.unit_occupancy ? String(tx.unit_occupancy).trim().toLowerCase() : "";
            return txOccupancy === targetOccupancy;
        });
    }, [transactions, leaseData.unitOccupancy]);

    if (!loading && !isAuthorized) {
        return (
            <div className="th-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="th-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
                    <ShieldAlert size={64} color="#dc2626" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: '#1f2937' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280', margin: '10px 0 20px' }}>
                        You do not have permission to view this transaction history.
                    </p>
                    <button className="th-btn-secondary" onClick={() => navigate('/login')}>
                        Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="th-loading">Loading records...</div>;

    return (
        <div id="transaction-history-root" className="th-container">
            <div className="th-card">
                <div className="th-header">
                    <div className="th-header-left">
                        <button className="leasing-information-back-btn" onClick={() => navigate(-1)}>
                            <ChevronLeft size={24} />
                        </button>
                        <div className="th-title-group">
                            <h2 id="th-main-title">Tenant Payment History</h2>
                            <p className="th-subtitle">
                                Viewing records for <strong>{leaseData.tenantName}</strong> at {leaseData.propertyName}
                            </p>
                        </div>
                    </div>
                    <button id="th-refresh-action" className="th-btn-secondary" onClick={fetchData}>
                        Refresh Data
                    </button>
                </div>

                {error && <div className="th-error-message" style={{ color: 'red', padding: '10px' }}>{error}</div>}

                <div className="th-table-responsive">
                    <table id="th-data-table" className="th-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Property</th>
                                <th>Unit Occupancy</th>
                                <th>Monthly Rate</th>
                                <th>Months Paid</th>
                                <th>Reference Number</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="th-row">
                                        <td>{new Date(tx.created_at).toLocaleString()}</td>
                                        <td>{tx.property_name || leaseData.propertyName}</td>
                                        <td>{tx.unit_occupancy || leaseData.unitOccupancy}</td>
                                        <td>₱{Number(tx.monthly_rate || leaseData.monthlyRate).toLocaleString()}</td>

                                        {/* New Columns */}
                                        <td>{tx.months_paid || '0'}</td>
                                        <td>{tx.reference_number || 'N/A'}</td>

                                        <td>₱{parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                        No transaction records found for this tenant.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}