import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Hooks
import UseFetchProperties from '../hooks/fetchProperties'
import fetchUser from '../hooks/fetchUser.jsx';

// Services
import { fetchInquiries, acceptInquiry, declineInquiry } from '../services/handleInquiries';
import { triggerBalanceUpdate } from '../hooks/updateBalance.jsx';

export default function InquiriesList() {
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const [occupancyDetails, setOccupancyDetails] = useState('');
    const [inquiries, setInquiries] = useState([]);

    const loadInquiries = async () => {
        setIsLoading(true);
        try {
            const data = await fetchInquiries();
            setInquiries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Inquiries Error:", error);

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


    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to decline this inquiry?")) return;

        try {
            const response = await declineInquiry(id);
            if (response.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== id));
            } else {
                alert(response.message || "Failed to decline inquiry.");
            }
        } catch (error) {
            console.error("Decline Error:", error);
            setInquiries(prev => prev.filter(iq => iq.id !== id));
        }
    };

    const handleAcceptClick = (inq) => {
        const property = properties.find(p => String(p.id) === String(inq.property_id));
        const monthlyRate = property ? parseFloat(property.price_monthly) : 0;

        if (inq.tenant_balance !== undefined) {
            const balance = parseFloat(inq.tenant_balance);

            if (balance < monthlyRate) {
                alert(
                    `Cannot Proceed: Insufficient Tenant Balance\n\n` +
                    `Tenant: ${inq.tenantName}\n` +
                    `Current Balance: ₱${balance.toLocaleString()}\n` +
                    `Required Rent: ₱${monthlyRate.toLocaleString()}\n\n` +
                    `The tenant must top up their wallet before you can accept this inquiry.`
                );
                return;
            }
        } else {
            console.warn("Tenant balance data missing from inquiry object.");
            console.log(inq)
        }

        setAcceptingId(inq.id);
    };

    const handleAcceptConfirm = async (inq) => {
        if (!occupancyDetails.trim()) {
            alert("Please enter occupancy details (e.g., Room 1A, Bed 3)");
            return;
        }

        try {
            const response = await acceptInquiry(inq, occupancyDetails);

            if (response.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== inq.id));
                setAcceptingId(null);
                setOccupancyDetails('');
                alert("Inquiry successfully accepted! First month's rent has been transferred.");
                triggerBalanceUpdate()
            } else {
                alert(response.message || "Failed to accept inquiry.");
            }
        } catch (error) {
            console.error("Accept Error:", error);
            setInquiries(prev => prev.filter(iq => iq.id !== inq.id));
            setAcceptingId(null);
            setOccupancyDetails('');
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    console.log(pendingInquiries)


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