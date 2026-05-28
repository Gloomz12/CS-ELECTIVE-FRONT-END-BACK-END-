import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams, useOutletContext } from "react-router-dom";

// Icons
import {
    ChevronLeft, CreditCard, CheckCircle,
    AlertTriangle, Calendar, Hash, Activity, History
} from 'lucide-react';

// Components
import { Toast } from '../components/toast.jsx';

// Services
import { userService, paymentService } from '../services/api.jsx';

// Hooks
import { USER_UPDATE_EVENT } from '../hooks/updateUser';
import useManageLeasePendings from '../hooks/useManageLeasePendings';

export default function LeasingInformation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();
    const { setIsGlobalLoading } = useOutletContext();
    const r = location.state?.renting;

    const [currentUser, setCurrentUser] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [monthsToPay, setMonthsToPay] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedMethod, setSelectedMethod] = useState(null);

    // Use a ref to ensure we only set the initial input value once, preventing typing interference
    const hasInitializedInput = useRef(false);

    const userId = currentUser?.id || localStorage.getItem("userId");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await userService.getProfile();
                if (userRes.data && userRes.data.data) {
                    setCurrentUser(userRes.data.data);
                }
            } catch (err) {
                console.error("Error fetching session data:", err);
            }
        };
        fetchUserData();
    }, []);

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const normalizedRenting = useMemo(() => {
        if (!r) return null;
        return {
            ...r,
            startDate: r.startDate || r.start_date,
            monthlyRate: parseFloat(r.monthlyRate || r.monthly_rate || 0),
            totalPaid: parseFloat(r.totalPaid || r.total_paid || 0),
            totalDue: parseFloat(r.totalDue || r.total_due || 0),
            leaseTerm: parseInt(r.leaseTerm || r.lease_term || 0)
        };
    }, [r]);

    // FIX: Memoize the array structure so it retains the same memory reference across renders
    const memoizedRentingsArray = useMemo(() => {
        return normalizedRenting ? [normalizedRenting] : [];
    }, [normalizedRenting]);

    const calculationResult = useManageLeasePendings(memoizedRentingsArray);
    const leaseData = calculationResult.length > 0 ? calculationResult[0] : null;

    const maxAllowedAdvance = useMemo(() => {
        if (!leaseData || leaseData.monthlyRate <= 0) return 0;
        const remainingBalance = Math.max(0, leaseData.totalDue - leaseData.totalPaid);
        return Math.floor(remainingBalance / leaseData.monthlyRate);
    }, [leaseData]);

    // FIX: Only apply the default "pending" calculation to the input on the first load
    useEffect(() => {
        if (leaseData && maxAllowedAdvance > 0 && !hasInitializedInput.current) {
            const pending = Math.ceil(leaseData.calculatedMonthsPending || 1);
            setMonthsToPay(Math.max(1, Math.min(pending, maxAllowedAdvance)));
            hasInitializedInput.current = true;
        }
    }, [leaseData, maxAllowedAdvance]);

    useEffect(() => {
        if (currentUser?.balance !== undefined) {
            setWalletBalance(parseFloat(currentUser.balance));
        }
    }, [currentUser]);

    const displayDates = useMemo(() => {
        if (!leaseData) return { start: '', paidUntil: '' };
        const start = new Date(leaseData.startDate);
        const paidUntil = new Date(start);
        const monthsPaid = Math.floor(leaseData.totalPaid / leaseData.monthlyRate);
        paidUntil.setMonth(paidUntil.getMonth() + monthsPaid);

        return {
            start: start.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paidUntil: paidUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };
    }, [leaseData]);

    if (!r || !leaseData) {
        return (
            <div className="leasing-information-page-layout">
                <p className="leasing-information-not-found">
                    Lease data not found.
                    <button className="leasing-information-go-back-btn" onClick={() => navigate('/main/rentings')}>Go back</button>
                </p>
            </div>
        );
    }

    const isFullyPaid = leaseData.totalPaid >= leaseData.totalDue;
    const amountToPay = (monthsToPay === '' ? 0 : monthsToPay) * leaseData.monthlyRate;

    const handlePayment = async () => {

        if (!selectedMethod) {
            showToast('Please select a payment method!', 'error');
            return;
        }
        if (!monthsToPay || monthsToPay < 1) {
            showToast('Please enter a valid number of months!', 'error');
            return;
        }
        if (amountToPay > walletBalance) {
            showToast('Insufficient wallet balance!', 'error');
            return;
        }

        setIsGlobalLoading(true);
        setIsProcessing(true);


        setIsGlobalLoading(true);
        setIsProcessing(true);

        const paymentData = {

            tenant_id: userId,
            owner_id: leaseData.ownerId,
            renting_id: leaseData.id,
            property_id: leaseData.propertyId,
            unit_occupancy: leaseData.unitOccupancy || null,
            amount: amountToPay,
            months_paid: monthsToPay,
            months_pending: leaseData.calculatedMonthsPending,
            status: leaseData.calculatedStatus,
            pending_payment: leaseData.calculatedPendingPayment,
            payment_method: selectedMethod
        };

        try {
            const response = await paymentService.process(paymentData);

            if (response.data.success) {
                showToast(`Payment successful! Ref: ${response.data.reference_number}`, "success");
                const updatedUser = await userService.getProfile();
                if (updatedUser.data?.data) {
                    setCurrentUser(updatedUser.data.data);
                }
                window.dispatchEvent(new Event(USER_UPDATE_EVENT));

                navigate('/main/rentings');
            } else {
                showToast(`Payment Failed: ${response.data.message}`, "error");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            showToast("An error occurred during payment.", "error");
        } finally {
            setIsGlobalLoading(false);
            setIsProcessing(false);
        }
    };

    return (
        <div id="leasing-information-layout" className="leasing-information-page-layout">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div id="leasing-information-main" className="leasing-information-page-main">
                <div id="leasing-information-content" className="leasing-information-page-content">
                    <div id="leasing-information-wrapper" className="leasing-information-wrapper">
                        <div id="leasing-information-container" className="leasing-information-container">
                            <div id="leasing-information-header" className="leasing-information-header">
                                <div className="leasing-info-header-left">
                                    <button id="leasing-information-back-btn" className="leasing-information-back-btn" onClick={() => navigate('/main/rentings')}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    <h2 id="leasing-information-title" className="leasing-information-title">
                                        Lease Details: {leaseData.propertyName || leaseData.property_name}
                                    </h2>
                                </div>
                                <button
                                    className="leasing-info-history-btn"
                                    onClick={() => navigate(
                                        `/main/transaction-history/${leaseData.id}/${leaseData.tenantId}/${(leaseData.unitOccupancy || 'unit').toLowerCase().replace(/\s+/g, '-')}`,
                                        { state: { leaseData } }
                                    )}
                                >
                                    <History size={18} />
                                    <span>History</span>
                                </button>
                            </div>

                            <div id="leasing-information-body" className="leasing-information-body">
                                <div id="leasing-information-main-col" className="leasing-information-main-col">
                                    <div className="leasing-information-status-wrapper">
                                        <span className={`leasing-information-status-badge ${leaseData.status === 'Active' ? 'leasing-information-status-active' : 'leasing-information-status-inactive'}`}>
                                            {leaseData.status}
                                        </span>
                                        <p className="leasing-information-member-since">Member since {displayDates.start}</p>
                                    </div>

                                    {isFullyPaid ? (
                                        <div className="leasing-information-banner leasing-information-banner-fully-paid">
                                            <CheckCircle size={24} />
                                            <div className="leasing-information-banner-text-wrapper">
                                                <h4>Contract Fully Paid</h4>
                                                <p>All payments completed for this lease.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {leaseData.calculatedStatus === 'Pending' && (
                                                <div className="leasing-information-banner leasing-information-banner-overdue">
                                                    <AlertTriangle size={24} />
                                                    <div className="leasing-information-banner-text-wrapper">
                                                        <h4>Payment Required</h4>
                                                        <p>You are <strong>{Math.ceil(leaseData.calculatedMonthsPending)}</strong> months behind.</p>
                                                        <p>Total Due: ₱{leaseData.calculatedPendingPayment.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {leaseData.calculatedStatus === 'Up to date' && (
                                                <div className="leasing-information-banner leasing-information-banner-uptodate">
                                                    <CheckCircle size={24} />
                                                    <div className="leasing-information-banner-text-wrapper">
                                                        <h4>Payment Up to Date</h4>
                                                        <p>Covered until <strong>{displayDates.paidUntil}</strong>.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="leasing-information-data-grid">
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label"><Calendar size={14} /> Lease Term</div>
                                            <div className="leasing-information-data-value">{leaseData.leaseTerm} Months</div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label"><Hash size={14} /> Monthly Rate</div>
                                            <div className="leasing-information-data-value">₱{leaseData.monthlyRate.toLocaleString()}</div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label"><Activity size={14} /> Contract Value</div>
                                            <div className="leasing-information-data-value">₱{leaseData.totalDue.toLocaleString()}</div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label"><CreditCard size={14} /> Total Paid</div>
                                            <div className="leasing-information-data-value leasing-information-value-blue">₱{leaseData.totalPaid.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="leasing-information-payment-col">
                                    <div className="leasing-information-payment-card">
                                        <h3 className="leasing-information-payment-title"><CreditCard size={18} /> Payment Portal</h3>
                                        <div className="leasing-information-payment-details">
                                            <div className="leasing-information-wallet-row">
                                                <span>Wallet Balance</span>
                                                <span className="leasing-information-wallet-amount">₱{walletBalance.toLocaleString()}</span>
                                            </div>

                                            <div className="leasing-information-payment-methods" style={{ marginTop: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>Select Method</label>
                                                <div className="payment-method-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {currentUser?.payment_methods && Object.entries(currentUser.payment_methods)
                                                        .filter(([_, isEnabled]) => isEnabled)
                                                        .map(([method]) => (
                                                            <button
                                                                key={method}
                                                                type="button"
                                                                className={`payment-method-btn ${selectedMethod === method ? 'active' : ''}`}
                                                                onClick={() => setSelectedMethod(method)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    border: selectedMethod === method ? '2px solid #007bff' : '1px solid #ccc',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    backgroundColor: selectedMethod === method ? '#e7f1ff' : 'white'
                                                                }}
                                                            >
                                                                {method.charAt(0).toUpperCase() + method.slice(1)}
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            </div>

                                            <div className="leasing-information-divider" style={{ margin: '15px 0' }}></div>

                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                Months to Pay (Max: {maxAllowedAdvance})
                                            </label>

                                            <input
                                                className="leasing-information-amount-input"
                                                type="number"
                                                min="1"
                                                max={maxAllowedAdvance}
                                                value={monthsToPay}
                                                disabled={isFullyPaid}
                                                onKeyDown={(e) => {
                                                    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value;
                                                    if (rawValue === '') {
                                                        setMonthsToPay('');
                                                        return;
                                                    }
                                                    const val = parseInt(rawValue, 10);
                                                    if (isNaN(val) || val < 1) {
                                                        setMonthsToPay('');
                                                        return;
                                                    }
                                                    const clampedValue = Math.min(val, maxAllowedAdvance);
                                                    setMonthsToPay(clampedValue);
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                                        setMonthsToPay(1);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    marginBottom: '10px'
                                                }}
                                            />

                                            <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                                                Total Amount: ₱{amountToPay.toLocaleString()}
                                            </div>

                                            <button
                                                className={`leasing-information-submit-btn ${isFullyPaid ? 'leasing-information-btn-fully-paid' : ''}`}
                                                onClick={handlePayment}
                                                disabled={
                                                    isFullyPaid ||
                                                    amountToPay > walletBalance ||
                                                    isProcessing ||
                                                    !selectedMethod ||
                                                    monthsToPay === '' ||
                                                    monthsToPay < 1
                                                }
                                                style={{ width: '100%', padding: '12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                {isFullyPaid
                                                    ? 'Fully Paid'
                                                    : isProcessing
                                                        ? 'Processing...'
                                                        : !selectedMethod
                                                            ? 'Select Method'
                                                            : `Pay ₱${amountToPay.toLocaleString()}`
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}