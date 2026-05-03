import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import { Home, Building, Calendar, ShieldCheck, LogOut, Wallet } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser.jsx';

export default function Sidebar({ activeTab }) {
    const navigate = useNavigate();
    const user = useFetchUser() || {};

    const handleLogout = async () => {
        try {
            await axios.get('http://localhost/api/auth/logout.php');
            localStorage.clear();
            window.location.href = '/';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="brand-logo">
                    <Home size={24} color="white" />
                </div>
                <span className="brand-text">Dorm Dash</span>
            </div>

            <div className="sidebar-profile-card">
                <div className="profile-upper">
                    <div className="avatar-wrapper">
                        <img
                            src={user.profPic || "/images/defaultProfPic.png"}
                            alt="User"
                            className="main-avatar"
                        />
                        <div className="online-indicator"></div>
                    </div>
                    <div className="profile-details">
                        <p className="profile-name">{user.username || "Guest User"}</p>
                    </div>
                </div>

                <div className="balance-card">
                    <div className="balance-info">
                        <Wallet size={14} className="wallet-icon" />
                        <span>Current Balance</span>
                    </div>
                    <p className="balance-amount">
                        {user.balance !== undefined ? `₱${Number(user.balance).toLocaleString()}` : "₱0.00"}
                    </p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    onClick={() => navigate('/main/home')}
                    className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                >
                    <Home size={20} />
                    <span className="nav-label">Homepage</span>
                </button>


                <button
                    onClick={() => navigate('/main/listings')}
                    className={`nav-btn ${activeTab === 'listings' || activeTab === 'properties' ? 'active' : ''}`}
                >
                    <Building size={20} />
                    <span className="nav-label">Browse Properties</span>
                </button>

                <button
                    onClick={() => navigate('/main/rentings')}
                    className={`nav-btn ${activeTab === 'rentings' ? 'active' : ''}`}
                >
                    <Calendar size={20} />
                    <span className="nav-label">My Rentings</span>
                </button>

                <button
                    onClick={() => navigate('/main/my-properties')}
                    className={`nav-btn ${activeTab === 'my-properties' ? 'active' : ''}`}
                >
                    <ShieldCheck size={20} />
                    <span className="nav-label">My Properties</span>
                </button>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-action">
                    <LogOut size={18} />
                    <span>Logout Session</span>
                </button>
            </div>
        </aside>
    );
}