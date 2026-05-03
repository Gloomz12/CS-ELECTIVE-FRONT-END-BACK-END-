import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

// Components
import Header from '../components/header.jsx';
import Sidebar from '../components/sidebar.jsx';

export default function Main() {
    const location = useLocation();
    
    const pathSegments = location.pathname.split('/');
    const activeTab = pathSegments[2] || 'home';

    return (

        <div id="app-container" className="app-layout">
            {/* SIDEBAR */}
            <Sidebar activeTab={activeTab} />

            {/* HEADER AND CONTENT */}
            <div className="content-wrapper">
                
                {/* HEADER */}
                <Header activeTab={activeTab} />

                {/* MAIN CONTENT AREA */}
                <main id="main-view" className="scrollable-content">
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}