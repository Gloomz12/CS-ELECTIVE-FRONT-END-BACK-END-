import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Services 
import { userService, propertyService, inquiryService } from '../services/api.jsx';

// Hooks
import { USER_UPDATE_EVENT } from '../hooks/updateUser';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

export default function InquiriesList() {
    const navigate = useNavigate();
    const { showToast, setIsGlobalLoading } = useOutletContext();

    const [isLoading, setIsLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState(null);
    const [occupancyDetails, setOccupancyDetails] = useState('');
    const [inquiries, setInquiries] = useState([]);
    const [properties, setProperties] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const storedUserId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

            const [userRes, propRes, inqRes] = await Promise.all([
                userService.getProfile(storedUserId).catch(() => ({ data: null })),
                propertyService.getAll().catch(() => ({ data: null })),
                inquiryService.getAll().catch(() => ({ data: null }))
            ]);

            if (userRes?.data) setCurrentUser(userRes.data?.data || userRes.data);
            if (propRes?.data) {
                const rawProperties = propRes.data?.data || (Array.isArray(propRes.data) ? propRes.data : []);
                setProperties(rawProperties);
            }
            if (inqRes?.data) {
                const rawInquiries = inqRes.data?.data || (Array.isArray(inqRes.data) ? inqRes.data : []);
                setInquiries(rawInquiries);
            }
        } catch (error) {
            console.error("Dashboard Data Aggregation Failure:", error);
            showToast("Failed to load pending configuration records.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const ownedProperties = useMemo(() => {
        const activeUserId = currentUser?.id || sessionStorage.getItem("userId") || localStorage.getItem("userId");
        return properties.filter(prop => String(prop.owner_id) === String(activeUserId));
    }, [properties, currentUser]);

    const pendingInquiries = useMemo(() => {
        return inquiries.filter(inquiry =>
            inquiry.status === 'pending' &&
            ownedProperties.some(prop => String(prop.id) === String(inquiry.property_id))
        );
    }, [inquiries, ownedProperties]);

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
        try {
            const res = await inquiryService.decline(id);
            if (res.data?.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== id));
                showToast("Inquiry declined.", "success");
            } else {
                showToast(res.data?.message || "Failed to decline.", "error");
            }
        } catch (error) {
            showToast("An interface exception occurred.", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleAcceptClick = async (inq) => {
        const property = properties.find(p => String(p.id) === String(inq.property_id));
        const monthlyRate = property ? parseFloat(property.price_monthly) : 0;

        try {
            // Verify real-time balance
            const userRes = await userService.getProfile(inq.tenant_id);
            const tenantBalance = parseFloat(userRes.data?.data?.balance || userRes.data?.balance || 0);

            if (tenantBalance < monthlyRate) {
                showToast(`Tenant does not have enough balance.`, "error");
                return;
            }
            setAcceptingId(inq.id);
        } catch (error) {
            console.error("Balance verification error:", error);
            showToast("Could not verify tenant balance.", "error");
        }
    };

    const handleAcceptConfirm = async (inq) => {
        if (!occupancyDetails.trim()) {
            showToast("Please enter occupancy details.", "error");
            return;
        }

        setIsGlobalLoading(true);
        try {
            const requestPayload = {
                inquiry_id: parseInt(inq.id, 10),
                unit_occupancy: occupancyDetails.trim()
            };

            const res = await inquiryService.accept(requestPayload);

            if (res.data?.success) {
                setInquiries(prev => prev.filter(iq => iq.id !== inq.id));
                setAcceptingId(null);
                setOccupancyDetails('');
                showToast(res.data?.message || "Accepted successfully!", "success");
                window.dispatchEvent(new Event(USER_UPDATE_EVENT));
            } else {
                showToast(res.data?.message || "Failed to process lease acceptance.", "error");
            }
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            showToast(serverMessage || "Network exception processing transaction.", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString.replace(' ', 'T')).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
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