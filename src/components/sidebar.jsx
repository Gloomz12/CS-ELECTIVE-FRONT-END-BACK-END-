import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import { Home, Building, Calendar, ShieldCheck, Settings, LogOut } from 'lucide-react';


export default function Sidebar({ activeTab, setActiveTab }) {

    const [subView, setSubView] = useState(null);
    const [toast, setToast] = useState(null);

    const navigateTo = (tab, sub = null) => {
        setActiveTab(tab);
        setSubView(sub);
    };

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost/api/auth/logout.php');
            localStorage.clear();
            window.location.href = '/';
        } catch (err) {
            console.error('Logout failed:', err);
            alert("Logout failed. Please try again.");
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Home size={28} className="brand-icon" />
                <span className="brand-text">Dorm Dash</span>
            </div>

            <nav className="sidebar-nav">
                <button
                    onClick={() => { navigateTo('listings'); navigate('/listings'); }}
                    className={`nav-btn ${activeTab === 'listings' ? 'active' : ''}`}
                >
                    <Building size={20} />
                    <span className="nav-label">Property Listings</span>
                </button>

                <button
                    onClick={() => { navigateTo('rentings'); navigate('/rentings'); }}
                    className={`nav-btn ${activeTab === 'rentings' ? 'active' : ''}`}
                >
                    <Calendar size={20} />
                    <span className="nav-label">My Rentings</span>
                </button>

                <button
                    onClick={() => { navigateTo('my-properties'); navigate('/my-properties'); }}
                    className={`nav-btn ${activeTab === 'my-properties' ? 'active' : ''}`}
                >
                    <ShieldCheck size={20} />
                    <span className="nav-label">My Properties</span>
                </button>
            </nav>

            <div className="sidebar-footer">

                <button
                    onClick={handleLogout}
                    className="nav-btn"
                >
                    <LogOut />
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}