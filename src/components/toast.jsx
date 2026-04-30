import React from "react";

// Icons
import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast({ toast }) {

    return (
        <div id="toast-notification" className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={20} className="icon-success" /> : <XCircle size={20} className="icon-error" />}
            <span className="toast-message">{toast.message}</span>
        </div>
    );

}