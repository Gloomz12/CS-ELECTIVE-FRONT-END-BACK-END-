import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Icons
import { ChevronLeft, CreditCard, CheckCircle, AlertTriangle, Calendar, Hash, Activity } from 'lucide-react';

// Services
import { PaymentService } from '../services/paymentService.jsx';

// Hooks
import useFetchUser from '../hooks/fetchUser.jsx';
import { triggerBalanceUpdate } from '../hooks/updateBalance.jsx';
import useManageLeasePendings from '../hooks/useManageLeasePendings';

export default function LeasingInformation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();
    const r = location.state?.renting;

    const currentUser = useFetchUser();
    const [walletBalance, setWalletBalance] = useState(0);
    const [amountToPay, setAmountToPay] = useState(0);
    const [advance, setAdvance] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const calculationResult = useManageLeasePendings(normalizedRenting ? [normalizedRenting] : []);
    const leaseData = calculationResult.length > 0 ? calculationResult[0] : null;

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

    useEffect(() => {
        if (leaseData) {
            let debt = leaseData.calculatedPendingPayment; 
            
            if (advance) {
                debt += leaseData.monthlyRate;
            }

            const remaining = Math.max(0, leaseData.totalDue - leaseData.totalPaid);
            if (debt > remaining) debt = remaining;

            setAmountToPay(debt);
        }
    }, [advance, leaseData]);

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

    const handlePayment = async () => {
        if (amountToPay > walletBalance) {
            alert('Insufficient wallet balance!');
            return;
        }

        setIsProcessing(true);
        const monthsPayingFor = Math.floor(amountToPay / leaseData.monthlyRate);

        const paymentData = {
            tenant_id: leaseData.tenantId || leaseData.tenant_id,
            owner_id: leaseData.ownerId || leaseData.owner_id,
            renting_id: leaseData.id,
            months_pending: leaseData.calculatedMonthsPending,
            status: leaseData.calculatedStatus,
            pending_payment: leaseData.calculatedPendingPayment,
            amount: amountToPay,
            months_paid: monthsPayingFor
        };

        const result = await PaymentService.processPropertyPayment(paymentData);

        if (result.success) {
            alert("Payment successful!");
            triggerBalanceUpdate();
            navigate('/main/rentings');
        } else {
            alert(`Payment Failed: ${result.message}`);
            setIsProcessing(false);
        }
    };

    return (
        <div id="leasing-information-layout" className="leasing-information-page-layout">
            <div id="leasing-information-main" className="leasing-information-page-main">
                <div id="leasing-information-content" className="leasing-information-page-content">
                    <div id="leasing-information-wrapper" className="leasing-information-wrapper">
                        <div id="leasing-information-container" className="leasing-information-container">

                            <div id="leasing-information-header" className="leasing-information-header">
                                <button id="leasing-information-back-btn" className="leasing-information-back-btn" onClick={() => navigate('/main/rentings')}>
                                    <ChevronLeft size={24} />
                                </button>
                                <h2 id="leasing-information-title" className="leasing-information-title">
                                    Lease Details: {leaseData.propertyName || leaseData.property_name}
                                </h2>
                            </div>

                            <div id="leasing-information-body" className="leasing-information-body">
                                <div id="leasing-information-main-col" className="leasing-information-main-col">

                                    <div id="leasing-information-status-wrapper" className="leasing-information-status-wrapper">
                                        <span className={`leasing-information-status-badge ${leaseData.status === 'Active' ? 'leasing-information-status-active' : 'leasing-information-status-inactive'}`}>
                                            {leaseData.status}
                                        </span>
                                        <p className="leasing-information-member-since">Member since {displayDates.start}</p>
                                    </div>

                                    {isFullyPaid ? (
                                        <div className="leasing-information-banner leasing-information-banner-fully-paid">
                                            <CheckCircle className="leasing-information-icon-fully-paid" size={24} />
                                            <div className="leasing-information-banner-text-wrapper">
                                                <h4 className="leasing-information-banner-title-fully-paid">Contract Fully Paid</h4>
                                                <p className="leasing-information-banner-desc-fully-paid">All payments completed for this lease.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {leaseData.calculatedStatus === 'Pending' && (
                                                <div className="leasing-information-banner leasing-information-banner-overdue">
                                                    <AlertTriangle className="leasing-information-icon-overdue" size={24} />
                                                    <div className="leasing-information-banner-text-wrapper">
                                                        <h4 className="leasing-information-banner-title-overdue">Payment Required</h4>
                                                        <p className="leasing-information-banner-desc-overdue">You are <strong>{Math.ceil(leaseData.calculatedMonthsPending)}</strong> months behind.</p>
                                                        <p className="leasing-information-banner-total-overdue">Total Due: ₱{leaseData.calculatedPendingPayment.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {leaseData.calculatedStatus === 'Up to date' && (
                                                <div className="leasing-information-banner leasing-information-banner-uptodate">
                                                    <CheckCircle className="leasing-information-icon-uptodate" size={24} />
                                                    <div className="leasing-information-banner-text-wrapper">
                                                        <h4 className="leasing-information-banner-title-uptodate">Payment Up to Date</h4>
                                                        <p className="leasing-information-banner-desc-uptodate">Covered until <strong>{displayDates.paidUntil}</strong>.</p>
                                                    </div>
                                                </div>
                                            )}

                                            {leaseData.calculatedStatus === 'Advanced payment' && (
                                                <div className="leasing-information-banner leasing-information-banner-advance">
                                                    <CheckCircle className="leasing-information-icon-advance" size={24} />
                                                    <div className="leasing-information-banner-text-wrapper">
                                                        <h4 className="leasing-information-banner-title-advance">Advance Paid</h4>
                                                        <p className="leasing-information-banner-desc-advance">You are ahead. Covered until <strong>{displayDates.paidUntil}</strong>.</p>
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
                                                <span className="leasing-information-wallet-label">Wallet Balance</span>
                                                <span className="leasing-information-wallet-amount">₱{walletBalance.toLocaleString()}</span>
                                            </div>
                                            <div className="leasing-information-divider"></div>
                                            <label className="leasing-information-amount-label">Amount to Pay</label>
                                            <input
                                                className="leasing-information-amount-input"
                                                type="number"
                                                value={amountToPay}
                                                max={leaseData.totalDue - leaseData.totalPaid}
                                                disabled={isFullyPaid}
                                                onChange={e => setAmountToPay(Math.min(Number(e.target.value), leaseData.totalDue - leaseData.totalPaid))}
                                            />
                                        </div>

                                        <label className="leasing-information-advance-label">
                                            <input
                                                className="leasing-information-advance-checkbox"
                                                type="checkbox"
                                                checked={advance}
                                                disabled={isFullyPaid}
                                                onChange={e => setAdvance(e.target.checked)}
                                            />
                                            <span className="leasing-information-advance-text">Pay 1 Month Advance (₱{leaseData.monthlyRate.toLocaleString()})</span>
                                        </label>

                                        <button
                                            className={`leasing-information-submit-btn ${isFullyPaid ? 'leasing-information-btn-fully-paid' : ''}`}
                                            onClick={handlePayment}
                                            disabled={isFullyPaid || amountToPay <= 0 || amountToPay > walletBalance || isProcessing}
                                        >
                                            {isFullyPaid ? 'Fully Paid' : isProcessing ? 'Processing...' : `Pay ₱${amountToPay.toLocaleString()}`}
                                        </button>

                                        {amountToPay > walletBalance && !isFullyPaid && (
                                            <p className="leasing-information-error-text">Insufficient funds in wallet.</p>
                                        )}
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