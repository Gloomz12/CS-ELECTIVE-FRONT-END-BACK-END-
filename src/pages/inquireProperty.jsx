import React, { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Mail } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser.jsx';


export default function InquireProperty() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useFetchUser() || {};


    const property = location.state?.currentProperty;

    const [leaseTerm, setLeaseTerm] = useState(12);

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

    const applicantName = user.legalName || user.username || "[Your Name]";

    const generatedMessage = `Dear ${property.username || 'Landlord'},

I hope this message finds you well. My name is ${applicantName}, and I am writing to formally express my interest in renting your property, ${property.name}, as listed on Dorm Dash.

I am looking to secure a lease for a duration of ${leaseTerm} months, beginning as soon as standard processing is complete. I have reviewed the listing details and I am prepared to meet the listed monthly rate of ₱${Number(property.price_monthly).toLocaleString()}.

Please let me know the next steps regarding the rental agreement and any further requirements you may need from my end.

Thank you for your time and consideration.

Sincerely,
${applicantName}
Date: ${new Date().toLocaleDateString()}`;

    const handleSend = () => {
        alert('Inquiry message sent to the landlord!');
        navigate(-1);
    };

    return (
        <div id="inquiry-page" className="inquiry-wrapper">
            <div className="inquiry-card">

                <div className="inquiry-header">
                    <button
                        onClick={() => navigate(-1)}
                        className="inquiry-back-btn"
                        title="Go Back"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="inquiry-title">Draft Inquiry</h2>
                </div>

                <div className="inquiry-body">

                    <div className="inquiry-info-banner">
                        <Info size={20} className="inquiry-info-icon" />
                        <p className="inquiry-info-text">
                            This formal inquiry letter is automatically generated using your profile information and the property details. Adjust the lease term below to update the letter before sending.
                        </p>
                    </div>

                    <div className="inquiry-form-group">
                        <label htmlFor="leaseTermInput" className="inquiry-label">
                            Desired Lease Term (Months)
                        </label>
                        <input
                            id="leaseTermInput"
                            type="number"
                            min="1"
                            max="60"
                            value={leaseTerm}
                            onChange={e => setLeaseTerm(e.target.value)}
                            className="inquiry-number-input"
                        />
                    </div>

                    <div className="inquiry-form-group">
                        <label htmlFor="messageBody" className="inquiry-label">
                            Formal Inquiry Message
                        </label>
                        <textarea
                            id="messageBody"
                            readOnly
                            value={generatedMessage}
                            className="inquiry-textarea"
                        />
                    </div>

                    <div className="inquiry-actions">
                        <button
                            onClick={handleSend}
                            className="inquiry-submit-btn"
                        >
                            <Mail size={20} />
                            <span>Finalize & Send Message</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}