import React, { useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Icons
import { ChevronLeft, ShieldAlert } from 'lucide-react';

// Hooks
import useFetchTransactions from '../hooks/fetchTransaction.jsx';
import useFetchUser from "../hooks/fetchUser.jsx";

export default function ViewTenantsTransaction() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const currentUser = useFetchUser();

    const leaseData = location.state?.leaseData || {
        id: null,
        propertyName: "Property Records",
        unitOccupancy: params.occupancy?.replace(/-/g, ' ') || "N/A",
        monthlyRate: 0
    };

    console.log(leaseData)

    const { transactions, loading, error, refetch } = useFetchTransactions(leaseData.ownerId);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx =>
            String(tx.renting_id) === String(leaseData.id)
        );
    }, [transactions, leaseData.id]);


    if (leaseData.ownerId != currentUser.id && !loading) {
        return (
            <div className="th-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="th-card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
                    <ShieldAlert size={64} color="#dc2626" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: '#1f2937' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280', margin: '10px 0 20px' }}>You do not have permission to view this transaction history.</p>
                    <button className="th-btn-secondary" onClick={() => navigate('/login')}>Login</button>
                </div>
            </div>
        );
    }


    if (loading) return <div className="th-loading">    Loading records...</div>;

    return (
        <div id="transaction-history-root" className="th-container">
            <div className="th-card">
                <div className="th-header">
                    <div className="th-header-left">
                        <button
                            className="leasing-information-back-btn"
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="th-title-group">
                            <h2 id="th-main-title">Tenant Payment History</h2>
                            <p className="th-subtitle">
                                Viewing records for <strong>{leaseData.tenantName || 'Tenant'}</strong> at {leaseData.propertyName}
                            </p>
                        </div>
                    </div>
                    <button
                        id="th-refresh-action"
                        className="th-btn-secondary"
                        onClick={refetch}
                    >
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
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="th-row">
                                        <td className="th-col-date">
                                            {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="th-col-property">
                                            <span className="th-property-name">
                                                {tx.property_name || leaseData.propertyName}
                                            </span>
                                        </td>
                                        <td className="th-col-occupancy">
                                            {tx.unit_occupancy || leaseData.unitOccupancy}
                                        </td>
                                        <td className="th-col-rate">
                                            ₱{Number(tx.monthly_rate || leaseData.monthlyRate).toLocaleString()}
                                        </td>
                                        <td className="th-col-type">
                                            <span className="th-type-tag">{tx.transaction_type}</span>
                                        </td>
                                        <td className="th-col-amount">
                                            <span className="th-currency">₱</span>
                                            {parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="th-col-status">
                                            <span className={`th-badge badge-${tx.status?.toLowerCase()}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="th-no-data" style={{ textAlign: 'center', padding: '20px' }}>
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