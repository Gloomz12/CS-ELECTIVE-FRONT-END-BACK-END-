    import React, { useState } from "react";
    import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
    import { ChevronLeft, Info, Mail } from 'lucide-react';

    // Hooks
    import useFetchUser from '../hooks/fetchUser.jsx';

    // Services
    import { sendInquiry } from '../services/sendInquiry.jsx';

    // Components
    import { ConfirmationModal } from '../components/confirmationModal.jsx';

    export default function InquireProperty() {
        const location = useLocation();
        const navigate = useNavigate();
        const user = useFetchUser() || {};
        const property = location.state?.currentProperty;

        const { showToast, setIsGlobalLoading } = useOutletContext();

        const [leaseTerm, setLeaseTerm] = useState(1);
        const [modalConfig, setModalConfig] = useState({ isOpen: false });

        if (!property) {
            return (
                <div className="inquiry-not-found">
                    <h2>Property details not found.</h2>
                    <button onClick={() => navigate('/main/listings')} className="inquiry-back-link">
                        Return to Listings
                    </button>
                </div>
            );
        }

        const applicantName = user.full_name;

        const generatedMessage = `Dear ${property.full_name || 'Landlord'},

    I hope this message finds you well. My name is ${applicantName}, and I am writing to formally express my interest in renting your property, ${property.name}, as listed on Dorm Dash.

    I am looking to secure a lease for a duration of ${leaseTerm} months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱${Number(property.price_monthly).toLocaleString()}.

    Please let me know the next steps regarding the rental agreement and any further requirements you may need from my end.

    Thank you for your time and consideration.

    Sincerely,
    ${applicantName}
    Date: ${new Date().toLocaleDateString()}`;

        const handleSendClick = () => {
            const currentBalance = Number(user.balance || 0);
            const monthlyRate = Number(property.price_monthly || 0);

            if (currentBalance < monthlyRate) {
                showToast(`Insufficient balance. You need ₱${monthlyRate.toLocaleString()}.`, 'error');
                return; 
            }

            setModalConfig({
                isOpen: true,
                title: "Confirm Inquiry",
                message: `Send this inquiry to ${property.full_name || 'the landlord'}?`,
                confirmText: "Send Now",
                onConfirm: () => executeSend(monthlyRate)
            });
        };

        const executeSend = async (monthlyRate) => {
            setModalConfig({ isOpen: false });
            
            setIsGlobalLoading(true);

            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

            const inquiryData = {
                property_id: property.id,
                tenant_id: user.id,
                lease_term_months: leaseTerm,
                message: generatedMessage,
                tenant_name: user.full_name,
                property_name: property.name,
                monthly_rate: property.price_monthly
            };

            try {
                const [result] = await Promise.all([
                    sendInquiry(inquiryData),
                    minDelay
                ]);

                if (result.success) {
                    showToast(`Inquiry sent! ₱${monthlyRate.toLocaleString()} will be deducted upon acceptance.`, 'success');
                    navigate(-1);
                } else {
                    showToast('Failed to send: ' + result.message, 'error');
                }
            } catch (error) {
                showToast('An unexpected error occurred.', 'error');
            } finally {
                setIsGlobalLoading(false);
            }
        };

        return (
            <div id="inquiry-page" className="inquiry-wrapper">
                <ConfirmationModal {...modalConfig} onCancel={() => setModalConfig({ isOpen: false })} />

                <div className="inquiry-card">
                    <div className="inquiry-header">
                        <button onClick={() => navigate(-1)} className="inquiry-back-btn">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="inquiry-title">Draft Inquiry</h2>
                    </div>

                    <div className="inquiry-body">
                        <div className="inquiry-info-banner">
                            <Info size={20} className="inquiry-info-icon" />
                            <p className="inquiry-info-text">
                                This letter is auto-generated. Adjust the lease term to update the message.
                            </p>
                        </div>

                        <div className="inquiry-form-group">
                            <label className="inquiry-label">Lease Term (Months)</label>
                            <input
                                type="number" min="1" max="60"
                                value={leaseTerm}
                                onChange={e => setLeaseTerm(e.target.value)}
                                className="inquiry-number-input"
                            />
                        </div>

                        <div className="inquiry-form-group">
                            <label className="inquiry-label">Message Preview</label>
                            <textarea readOnly value={generatedMessage} className="inquiry-textarea" />
                        </div>

                        <div className="inquiry-actions">
                            <button onClick={handleSendClick} className="inquiry-submit-btn">
                                <Mail size={20} />
                                <span>Finalize & Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }