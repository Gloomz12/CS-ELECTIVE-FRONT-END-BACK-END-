import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Icons
import { ChevronLeft, ShieldAlert } from 'lucide-react';

// Services
import { propertyService, userService } from '../services/api.jsx';

export default function TransactionHistory() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [transactions, setTransactions] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const leaseData = location.state?.leaseData || {
        id: params.leaseId || null,
        propertyName: "Property Details",
        unitOccupancy: params.occupancy?.replace(/-/g, ' ') || "N/A",
        monthlyRate: 0
    };

    console.log(leaseData)

    const storedUserId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
    const storedRole = sessionStorage.getItem("role") || localStorage.getItem("role");

    const isAuthorized = useMemo(() => {
        if (!storedUserId ) return false;

        const isOwnerOfData = String(storedUserId);
        const isAdmin = currentUser?.id === leaseData?.tenantId;

        console.log(isAdmin)
        console.log(isOwnerOfData)

        return isOwnerOfData || isAdmin;
    }, [storedUserId, currentUser, storedRole]);


    const fetchData = useCallback(async () => {
        if (!isAuthorized) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [userRes, txRes] = await Promise.all([
                userService.getProfile().catch(() => ({ data: null })), 
                propertyService.getAllTransactions()
            ]);
            
            if (userRes?.data) {
                setCurrentUser(userRes.data);
            }

            const rawTransactions = txRes.data?.data || (Array.isArray(txRes.data) ? txRes.data : []);
            setTransactions(rawTransactions);
            console.log(rawTransactions)
        } catch (err) {
            console.error("Failed to fetch transaction history:", err);
            setError("Failed to load records. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [isAuthorized]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTransactions = useMemo(() => {
        const txArray = Array.isArray(transactions) ? transactions : [];
        return txArray.filter(tx =>
            !leaseData.id || String(tx.renting_id) === String(leaseData.id)
        );
    }, [transactions, leaseData.id]);

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
                        <button
                            className="leasing-information-back-btn"
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="th-title-group">
                            <h2 id="th-main-title">Transaction History</h2>
                            <p className="th-subtitle">
                                {leaseData.propertyName ? `Payments for ${leaseData.propertyName}` : "View recent payments"}
                            </p>
                        </div>
                    </div>
                    <button
                        id="th-refresh-action"
                        className="th-btn-secondary"
                        onClick={fetchData}
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
                                <th>Occupancy</th>
                                <th>Monthly Rate</th>
                                <th>Method</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id || Math.random()} className="th-row">
                                        <td className="th-col-date">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }) : 'N/A'}
                                        </td>
                                        <td className="th-col-property">
                                            <span className="th-property-name">
                                                {tx.property_name || leaseData?.propertyName || 'General'}
                                            </span>
                                        </td>
                                        <td className="th-col-occupancy">
                                            {tx.unit_occupancy || leaseData.unitOccupancy}
                                        </td>
                                        <td className="th-col-rate">
                                            ₱{Number(tx.monthly_rate || leaseData.monthlyRate || 0).toLocaleString()}
                                        </td>
                                        <td className="th-col-method">{tx.payment_method || 'N/A'}</td>
                                        <td className="th-col-amount">
                                            <span className="th-currency">₱</span>
                                            {parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="th-no-data" style={{ textAlign: 'center', padding: '20px' }}>
                                        No transactions found.
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