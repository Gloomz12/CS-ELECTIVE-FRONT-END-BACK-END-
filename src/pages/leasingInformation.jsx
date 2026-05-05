import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Info, CreditCard, CheckCircle, AlertTriangle, Calendar, Hash, Activity } from 'lucide-react';
import { paymentService } from '../services/paymentService.jsx';
import { UseTriggerBalanceUpdate } from '../hooks/updateBalance.jsx';
import useFetchUser from '../hooks/fetchUser.jsx';

export default function LeasingInformation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();
    const r = location.state?.renting;
    const triggerBalanceUpdate = UseTriggerBalanceUpdate();

    const currentUser = useFetchUser();
    const [walletBalance, setWalletBalance] = useState(0);
    const [amountToPay, setAmountToPay] = useState(0);
    const [advance, setAdvance] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (currentUser?.balance !== undefined) {
            setWalletBalance(parseFloat(currentUser.balance));
        }
    }, [currentUser]);

    const leaseData = useMemo(() => {
        if (!r) return null;

        const monthlyRate = parseFloat(r.monthlyRate || r.monthly_rate || 0);
        const totalPaid = parseFloat(r.totalPaid || r.total_paid || 0);
        const startDateObj = new Date(r.startDate || r.start_date);
        const currentDateObj = new Date();

        let monthsElapsed = (currentDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + (currentDateObj.getMonth() - startDateObj.getMonth());
        if (currentDateObj.getDate() < startDateObj.getDate()) {
            monthsElapsed--;
        }
        monthsElapsed = Math.max(0, monthsElapsed);

        const monthsPaidTotal = monthlyRate > 0 ? Math.floor(totalPaid / monthlyRate) : 0;
        const paidUntilDate = new Date(startDateObj);
        paidUntilDate.setMonth(paidUntilDate.getMonth() + monthsPaidTotal);

        const monthsPending = monthsElapsed - monthsPaidTotal;
        const pendingPayment = Math.max(0, monthsPending * monthlyRate);

        return {
            ...r,
            monthlyRate,
            totalPaid,
            monthsPending,
            pendingPayment,
            paidUntilDate,
            formattedPaidUntil: paidUntilDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            formattedStartDate: startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            isOverdue: monthsPending > 0,
            isUpToDate: monthsPending === 0,
            isAdvance: monthsPending < 0
        };
    }, [r]);

    useEffect(() => {
        if (leaseData) {
            const advanceAmount = advance ? leaseData.monthlyRate : 0;
            setAmountToPay(leaseData.pendingPayment + advanceAmount);
        }
    }, [advance, leaseData]);

    if (!r || !leaseData) {
        return (
            <div id="leasing-information-error-layout" className="leasing-information-page-layout">
                <div id="leasing-information-error-main" className="leasing-information-page-main">
                    <div id="leasing-information-error-content" className="leasing-information-page-content">
                        <p id="leasing-information-not-found-text" className="leasing-information-not-found">
                            Lease data not found.
                            <button
                                id="leasing-information-go-back-btn"
                                className="leasing-information-go-back-btn"
                                onClick={() => navigate('/main/rentings')}
                            >
                                Go back
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handlePayment = async () => {
        if (amountToPay > walletBalance) {
            alert('Insufficient wallet balance!');
            return;
        }

        setIsProcessing(true);
        const monthsPayingFor = Math.floor(amountToPay / leaseData.monthlyRate);

        const ownerId = leaseData.ownerId;

        const paymentData = {
            tenant_id: leaseData.tenantId || leaseData.tenant_id,
            owner_id: ownerId,
            renting_id: leaseData.id,
            amount: amountToPay,
            months_paid: monthsPayingFor
        };

        const result = await paymentService.processPropertyPayment(paymentData);

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
                                <button
                                    id="leasing-information-back-btn"
                                    className="leasing-information-back-btn"
                                    onClick={() => navigate('/main/rentings')}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <h2 id="leasing-information-title" className="leasing-information-title">
                                    Lease Details: {leaseData.propertyName || leaseData.property_name}
                                </h2>
                            </div>

                            <div id="leasing-information-body" className="leasing-information-body">
                                <div id="leasing-information-main-col" className="leasing-information-main-col">

                                    <div id="leasing-information-status-wrapper" className="leasing-information-status-wrapper">
                                        <span
                                            id="leasing-information-status-badge"
                                            className={`leasing-information-status-badge ${leaseData.status === 'Active' ? 'leasing-information-status-active' : 'leasing-information-status-inactive'}`}
                                        >
                                            {leaseData.status}
                                        </span>
                                        <p id="leasing-information-member-since" className="leasing-information-member-since">
                                            Member since {leaseData.formattedStartDate}
                                        </p>
                                    </div>

                                    {leaseData.isOverdue && (
                                        <div id="leasing-information-banner-overdue" className="leasing-information-banner leasing-information-banner-overdue">
                                            <AlertTriangle className="leasing-information-icon-overdue" size={24} />
                                            <div className="leasing-information-banner-text-wrapper">
                                                <h4 className="leasing-information-banner-title-overdue">Payment Required</h4>
                                                <p className="leasing-information-banner-desc-overdue">
                                                    You have <strong className="leasing-information-bold">{leaseData.monthsPending}</strong> pending months.
                                                </p>
                                                <p className="leasing-information-banner-total-overdue">
                                                    Total Arrears: ₱{leaseData.pendingPayment.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {leaseData.isUpToDate && (
                                        <div id="leasing-information-banner-uptodate" className="leasing-information-banner leasing-information-banner-uptodate">
                                            <CheckCircle className="leasing-information-icon-uptodate" size={24} />
                                            <div className="leasing-information-banner-text-wrapper">
                                                <h4 className="leasing-information-banner-title-uptodate">Fully Paid</h4>
                                                <p className="leasing-information-banner-desc-uptodate">
                                                    Your rent is covered until <strong className="leasing-information-bold">{leaseData.formattedPaidUntil}</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {leaseData.isAdvance && (
                                        <div id="leasing-information-banner-advance" className="leasing-information-banner leasing-information-banner-advance">
                                            <CheckCircle className="leasing-information-icon-advance" size={24} />
                                            <div className="leasing-information-banner-text-wrapper">
                                                <h4 className="leasing-information-banner-title-advance">Advance Paid</h4>
                                                <p className="leasing-information-banner-desc-advance">
                                                    You are ahead of schedule. Rent is covered until <strong className="leasing-information-bold">{leaseData.formattedPaidUntil}</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div id="leasing-information-data-grid" className="leasing-information-data-grid">
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label">
                                                <Calendar size={14} /> Lease Term
                                            </div>
                                            <div className="leasing-information-data-value">
                                                {leaseData.leaseTerm || leaseData.lease_term} Months
                                            </div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label">
                                                <Hash size={14} /> Monthly Rate
                                            </div>
                                            <div className="leasing-information-data-value">
                                                ₱{leaseData.monthlyRate.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label">
                                                <Activity size={14} /> Total Contract Value
                                            </div>
                                            <div className="leasing-information-data-value">
                                                ₱{parseFloat(leaseData.totalDue || leaseData.total_due || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="leasing-information-data-card">
                                            <div className="leasing-information-data-label">
                                                <CreditCard size={14} /> Total Paid
                                            </div>
                                            <div className="leasing-information-data-value leasing-information-value-blue">
                                                ₱{leaseData.totalPaid.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="leasing-information-payment-col" className="leasing-information-payment-col">
                                    <div id="leasing-information-payment-card" className="leasing-information-payment-card">
                                        <h3 id="leasing-information-payment-title" className="leasing-information-payment-title">
                                            <CreditCard size={18} /> Payment Portal
                                        </h3>

                                        <div id="leasing-information-payment-details" className="leasing-information-payment-details">
                                            <div id="leasing-information-wallet-row" className="leasing-information-wallet-row">
                                                <span className="leasing-information-wallet-label">Wallet Balance</span>
                                                <span className="leasing-information-wallet-amount">₱{walletBalance.toLocaleString()}</span>
                                            </div>
                                            <div id="leasing-information-divider" className="leasing-information-divider"></div>

                                            <label id="leasing-information-amount-label" className="leasing-information-amount-label">Amount to Pay</label>
                                            <input
                                                id="leasing-information-amount-input"
                                                className="leasing-information-amount-input"
                                                type="number"
                                                value={amountToPay}
                                                onChange={e => setAmountToPay(Number(e.target.value))}
                                            />
                                        </div>

                                        <label id="leasing-information-advance-label" className="leasing-information-advance-label">
                                            <input
                                                id="leasing-information-advance-checkbox"
                                                className="leasing-information-advance-checkbox"
                                                type="checkbox"
                                                checked={advance}
                                                onChange={e => setAdvance(e.target.checked)}
                                            />
                                            <span className="leasing-information-advance-text">
                                                Pay 1 Month Advance (₱{leaseData.monthlyRate.toLocaleString()})
                                            </span>
                                        </label>

                                        <button
                                            id="leasing-information-submit-btn"
                                            className="leasing-information-submit-btn"
                                            onClick={handlePayment}
                                            disabled={amountToPay <= 0 || amountToPay > walletBalance || isProcessing}
                                        >
                                            {isProcessing ? 'Processing...' : `Pay ₱${amountToPay.toLocaleString()}`}
                                        </button>

                                        {amountToPay > walletBalance && (
                                            <p id="leasing-information-error-text" className="leasing-information-error-text">
                                                Insufficient funds in wallet.
                                            </p>
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