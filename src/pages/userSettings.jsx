import React, { useState, useEffect } from 'react';
import { User, CheckCircle } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser';
import { triggerUserUpdate } from '../hooks/updateUser';

// Services
import { updateUserSettings } from '../services/handleUserSettings';


export default function UserSettings() {
    const currentUser = useFetchUser();
    const userId = localStorage.getItem("userId");

    const [formData, setFormData] = useState({
        username: "",
        legalName: "",
        phone: "",
        dob: "",
        address: "",
        country: "",
        gender: "Male",
        balance: 0,
        profPic: "https://via.placeholder.com/150",
        paymentMethods: {
            gCash: false,
            payMaya: false,
            bankTransfer: false,
            cash: false
        }
    });

    useEffect(() => {
        if (currentUser && Object.keys(currentUser).length > 0) {

            let parsedPaymentMethods = {
                gCash: false, payMaya: false, bankTransfer: false, cash: false
            };

            if (currentUser.payment_methods) {
                try {
                    const dbMethods = typeof currentUser.payment_methods === 'string'
                        ? JSON.parse(currentUser.payment_methods)
                        : currentUser.payment_methods;

                    parsedPaymentMethods = { ...parsedPaymentMethods, ...dbMethods };
                } catch (error) {
                    console.error("Failed to parse payment methods", error);
                }
            }

            setFormData(prev => ({
                ...prev,
                username: currentUser.username || "",
                legalName: currentUser.full_name || "",
                phone: currentUser.phone_number || "",
                dob: currentUser.date_of_birth || "",
                address: currentUser.address || "",
                country: currentUser.country || "",
                gender: currentUser.gender || "Male",
                balance: currentUser.balance ? parseFloat(currentUser.balance) : 0,
                profPic: currentUser.profile_picture || "https://via.placeholder.com/150",
                paymentMethods: parsedPaymentMethods
            }));
        }
    }, [currentUser]);

    const handlePaymentToggle = (method) => {
        setFormData({
            ...formData,
            paymentMethods: {
                ...formData.paymentMethods,
                [method]: !formData.paymentMethods[method]
            }
        });
    };

    const handleSave = async () => {
        if (!userId) {
            alert("Error: User ID not found.");
            return;
        }

        const result = await updateUserSettings(userId, formData);

        if (result.success) {
            alert("Settings updated successfully!");

            triggerUserUpdate();

        } else {
            alert("Failed to update settings: " + result.message);
        }
    };

    return (
        <div id="settings-page-wrapper" className="settings-container">
            <div className="settings-card">
                <h2 className="settings-title">
                    <User className="icon-teal" /> My Profile
                </h2>

                <div className="profile-layout">
                    <div className="avatar-section">
                        <img
                            src={formData.profPic}
                            alt="Profile"
                            className="profile-avatar"
                        />
                        <div className="balance-badge">
                            <p className="balance-label">Total Wallet Balance</p>
                            <p className="balance-amount">₱{formData.balance.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Full Legal Name</label>
                            <input type="text" value={formData.legalName} onChange={e => setFormData({ ...formData, legalName: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone Number</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group span-full">
                            <label className="input-label">Address</label>
                            <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Country</label>
                            <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="form-input" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Gender</label>
                            <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="form-input">
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="payment-section">
                    <h3 className="sub-title">Payment Methods</h3>
                    <div className="payment-grid">
                        {Object.keys(formData.paymentMethods).map(method => (
                            <label key={method} className={`payment-option ${formData.paymentMethods[method] ? 'active' : ''}`}>
                                <input type="checkbox" className="hidden-checkbox" checked={formData.paymentMethods[method]} onChange={() => handlePaymentToggle(method)} />
                                <span className="method-name">{method.replace(/([A-Z])/g, ' $1').trim()}</span>
                                {formData.paymentMethods[method] && <CheckCircle size={16} className="icon-check" />}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button onClick={handleSave} className="btn-save">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}