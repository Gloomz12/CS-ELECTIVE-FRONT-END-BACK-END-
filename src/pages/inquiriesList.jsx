import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Hooks
import UseFetchProperties from '../hooks/fetchProperties';
import fetchUser from '../hooks/fetchUser.jsx';
import { triggerBalanceUpdate } from '../hooks/updateBalance.jsx';

// Services
import { fetchInquiries, acceptInquiry, declineInquiry } from '../services/handleInquiries';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

export default function InquiriesList() {
    const navigate = useNavigate();
    const { showToast, setIsGlobalLoading } = useOutletContext();

    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const [occupancyDetails, setOccupancyDetails] = useState('');
    const [inquiries, setInquiries] = useState([]);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const data = await fetchInquiries();
            setInquiries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Inquiries Error:", error);
            showToast("Failed to load inquiries.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const currentUser = fetchUser();
    const properties = UseFetchProperties();

    const ownedProperties = properties.filter(prop => String(prop.owner_id) === String(currentUser?.id));

    const pendingInquiries = inquiries.filter(inquiry =>
        inquiry.status === 'pending' &&
        ownedProperties.some(prop => String(prop.id) === String(inquiry.property_id))
    );

    const handleReject = (id) => {
        setModalConfig({
            isOpen: true,
            title: "Decline Inquiry",
            message: "Are you sure you want to decline this inquiry? This action cannot be undone.",
            confirmText: "Decline",
            onConfirm: () => executeReject(id)
        });
    };

    const executeReject = async (id) => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const [response] = await Promise.all([declineInquiry(id), minDelay]);
            if (response.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== id));
                showToast("Inquiry declined.", "success");
            } else {
                showToast(response.message || "Failed to decline.", "error");
            }
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleAcceptClick = (inq) => {
        const property = properties.find(p => String(p.id) === String(inq.property_id));
        const monthlyRate = property ? parseFloat(property.price_monthly) : 0;

        if (inq.tenant_balance !== undefined) {
            const balance = parseFloat(inq.tenant_balance);

            if (balance < monthlyRate) {
                showToast(`Tenant has insufficient balance (₱${balance.toLocaleString()}).`, "error");
                return;
            }
        }
        setAcceptingId(inq.id);
    };

    const handleAcceptConfirm = async (inq) => {
        if (!occupancyDetails.trim()) {
            showToast("Please enter occupancy details.", "error");
            return;
        }

        setIsGlobalLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const [response] = await Promise.all([acceptInquiry(inq, occupancyDetails), minDelay]);
            if (response.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== inq.id));
                setAcceptingId(null);
                showToast("Accepted successfully!", "success");
                triggerBalanceUpdate();
            }
        } finally {
            setIsGlobalLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString.replace(' ', 'T'));
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="page-layout">
            <ConfirmationModal {...modalConfig} onCancel={() => setModalConfig({ isOpen: false })} />
            <div className="page-main">
                <div className="page-content">
                    <div className="my-properties-container">

                        <div className="property-form-header">
                            <button onClick={() => navigate('/main/my-properties')} className="property-form-back-btn">
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="property-form-title">Property Inquiries</h2>
                        </div>

                        <div className="inquiries-list-wrapper">
                            {isLoading ? (
                                <div className="inquiries-loading-state">
                                    <Loader2 className="spinner-icon" />
                                    <p>Loading pending inquiries...</p>
                                </div>
                            ) : (
                                <>
                                    {pendingInquiries.map(inq => (
                                        <div key={inq.id} className="inquiries-list-card">
                                            <div className="inquiries-list-header">
                                                <div>
                                                    <h3 className="inquiries-list-title">Inquiry for {inq.property_name}</h3>
                                                    <p className="inquiries-list-subtitle">From: {inq.tenant_name} • Requested Term: {inq.lease_term_months} months</p>
                                                </div>
                                                <span className="inquiries-list-date">{formatDate(inq.created_at)}</span>
                                            </div>

                                            <div className="inquiries-list-message-box">
                                                <p className="inquiries-list-message">{inq.message}</p>
                                            </div>

                                            {acceptingId === inq.id ? (
                                                <div className="inquiries-list-assign-box">
                                                    <label className="inquiries-list-assign-label">Assign Occupancy (e.g., Room 1A, Bed 3)</label>
                                                    <div className="inquiries-list-assign-controls">
                                                        <input
                                                            type="text"
                                                            value={occupancyDetails}
                                                            onChange={(e) => setOccupancyDetails(e.target.value)}
                                                            placeholder="Enter occupancy details..."
                                                            className="inquiries-list-input"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleAcceptConfirm(inq)} className="inquiries-list-btn-confirm">Confirm & Deduct Rent</button>
                                                        <button onClick={() => { setAcceptingId(null); setOccupancyDetails(''); }} className="inquiries-list-btn-cancel">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="inquiries-list-actions">
                                                    <button onClick={() => handleReject(inq.id)} className="inquiries-list-btn-reject">
                                                        <XCircle size={18} /> Reject
                                                    </button>
                                                    <button onClick={() => handleAcceptClick(inq)} className="inquiries-list-btn-accept">
                                                        <CheckCircle size={18} /> Accept & Proceed
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {pendingInquiries.length === 0 && <p className="my-properties-empty-msg">No pending inquiries.</p>}
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}