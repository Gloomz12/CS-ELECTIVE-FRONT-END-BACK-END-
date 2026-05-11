import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Components
import Header from '../components/header.jsx';
import Sidebar from '../components/sidebar.jsx';
import { Toast } from '../components/toast.jsx';


export default function Main() {
    const location = useLocation();
    
    const pathSegments = location.pathname.split('/');
    const activeTab = pathSegments[2] || 'home';

    const [toast, setToast] = useState(null);
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    return (
        <div id="app-container" className="app-layout">
            
            {isGlobalLoading && (
                <div id="global-app-loader-overlay">
                    <div className="global-loader-card">
                        <Loader2 size={40} className="animate-spin-custom" />
                        <p className="global-loader-text">Processing...</p>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            <Sidebar activeTab={activeTab} />

            <div className="content-wrapper">
                
                {/* HEADER  */}
                <Header activeTab={activeTab} />

                <main id="main-view" className="scrollable-content">
                    
                    {toast && (
                        <Toast 
                            message={toast.message} 
                            type={toast.type} 
                            onClose={() => setToast(null)} 
                        />
                    )}

                    <Outlet context={{ showToast, setIsGlobalLoading }} /> 
                </main>
            </div>
        </div>
    );
}