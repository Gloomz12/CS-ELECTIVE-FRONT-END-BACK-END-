import React from 'react';

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="popup-overlay" id="popup-confirmation-overlay">
            <div className="popup-content">
                <h3 className="popup-title">{title}</h3>
                <p className="popup-description">{message}</p>
                <div className="popup-actions">
                    <button
                        className="popup-btn popup-btn-cancel"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className={`popup-btn ${isDestructive ? 'popup-btn-reject' : 'popup-btn-confirm'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};