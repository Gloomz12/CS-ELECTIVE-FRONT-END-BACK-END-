import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, CheckCircle, Loader2 } from 'lucide-react';

// Hooks
import { triggerUserUpdate } from '../hooks/updateUser';

// Services
import { userService } from '../services/api';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

export default function UserSettings() {
    const { showToast, setIsGlobalLoading } = useOutletContext();

    const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
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
        if (!userId) {
            showToast("Session expired or invalid. Please log in again.", "error");
            setIsPageLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await userService.getProfile(userId);

                if (response.data && response.data.success) {
                    const currentUser = response.data.data || response.data;
                    console.log(currentUser)

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
                    console.log(userId)
                    console.log(currentUser)

                    setFormData({
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
                    });
                } else {
                    showToast(response.data?.message || "Failed to load user profile.", "error");
                }
            } catch (error) {
                console.error("Profile load failure:", error);
                showToast("Server unreachable while syncing profile data.", "error");
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFormData({
                ...formData,
                profPic: previewUrl
            });
            showToast(`Selected file: ${file.name}`, "success");
        }
    };

    const handlePaymentToggle = (method) => {
        setFormData({
            ...formData,
            paymentMethods: {
                ...formData.paymentMethods,
                [method]: !formData.paymentMethods[method]
            }
        });
    };

    const handleSaveClick = () => {
        if (!userId) {
            showToast("Error: User ID session context not found.", "error");
            return;
        }

        setModalConfig({
            isOpen: true,
            title: "Save Changes",
            message: "Are you sure you want to update your profile information?",
            confirmText: "Save",
            onConfirm: executeSave
        });
    };

    const executeSave = async () => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);

        const submissionPayload = new FormData();
        submissionPayload.append('_method', 'PUT');
        submissionPayload.append('user_id', userId);
        submissionPayload.append('username', formData.username);
        submissionPayload.append('full_name', formData.legalName);
        submissionPayload.append('phone_number', formData.phone);
        submissionPayload.append('date_of_birth', formData.dob);
        submissionPayload.append('address', formData.address);
        submissionPayload.append('country', formData.country);
        submissionPayload.append('gender', formData.gender);
        submissionPayload.append('payment_methods', JSON.stringify(formData.paymentMethods));

        if (fileInputRef.current && fileInputRef.current.files.length > 0) {
            const file = fileInputRef.current.files[0];
            submissionPayload.append('profile_picture', file.name);
            submissionPayload.append('profile_image', file);
        } else {
            const existingFilename = formData.profPic.split('/').pop();
            submissionPayload.append('profile_picture', existingFilename);
        }

        try {
            const response = await userService.updateProfile(submissionPayload);

            if (response.data && response.data.success) {
                showToast("Settings updated successfully!", "success");
                triggerUserUpdate();
                if (response.data.new_profPic) {
                    setFormData(prev => ({ ...prev, profPic: response.data.new_profPic }));
                    setSelectedFile(null);
                }
            } else {
                showToast("Update failed: " + (response.data?.message || "Unknown error"), "error");
            }
        } catch (error) {
            showToast("Error updating profile", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    if (isPageLoading) {
        return (
            <div className="settings-container">
                <div className="inquiries-loading-state">
                    <Loader2 className="spinner-icon animate-spin-custom" />
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div id="settings-page-wrapper" className="settings-container">
            <ConfirmationModal
                {...modalConfig}
                onCancel={() => setModalConfig({ isOpen: false })}
            />

            <div className="settings-card">
                <h2 className="settings-title">
                    <User className="icon-teal" /> My Profile
                </h2>

                <div className="profile-layout">
                    <div className="avatar-section">
                        <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
                            <img
                                src={formData.profPic}
                                alt="Profile"
                                className="profile-avatar"
                            />
                            <div className="avatar-overlay">Change Photo</div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden-file-input"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="balance-badge">
                            <p className="balance-label">Total Wallet Balance</p>
                            <p className="balance-amount">₱{formData.balance.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Full Legal Name</label>
                            <input
                                type="text"
                                value={formData.legalName}
                                onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone Number</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group span-full">
                            <label className="input-label">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                className="form-input"
                            >
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
                                <input
                                    type="checkbox"
                                    className="hidden-checkbox"
                                    checked={formData.paymentMethods[method]}
                                    onChange={() => handlePaymentToggle(method)}
                                />
                                <span className="method-name">{method.replace(/([A-Z])/g, ' $1').trim()}</span>
                                {formData.paymentMethods[method] && <CheckCircle size={16} className="icon-check" />}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button onClick={handleSaveClick} className="btn-save">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}