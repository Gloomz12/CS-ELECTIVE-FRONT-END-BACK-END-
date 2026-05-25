import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import { Home, Building, Calendar, ShieldCheck, LogOut, Wallet } from 'lucide-react';

// Services
import { authService, userService } from '../services/api';

// Hook
import { USER_UPDATE_EVENT } from '../hooks/updateUser'; 

export default function Sidebar({ activeTab }) {
    const navigate = useNavigate();
    const [user, setUser] = useState({});

    const fetchUserProfile = useCallback(async () => {
        try {
            const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
            if (!userId) return; // Prevent unnecessary API calls if no token is found
            
            const response = await userService.getProfile(userId);
            if (response.data && response.data.success) {
                setUser(response.data.data);
            } else if (response.data) {
                setUser(response.data);
            }
        } catch (err) {
            console.error('Failed to load user profile in Sidebar:', err);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();

        window.addEventListener(USER_UPDATE_EVENT, fetchUserProfile);

        return () => {
            window.removeEventListener(USER_UPDATE_EVENT, fetchUserProfile);
        };
    }, [fetchUserProfile]);

    const displayUsername = user.username
        ? user.username.length > 15
            ? `${user.username.substring(0, 15)}...`
            : user.username
        : "Guest User";

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error('Logout request failed:', err);
        } finally {
            navigate('/login'); 
        }
    };

    const defaultFallbackPic = process.env.PUBLIC_URL 
        ? `${process.env.PUBLIC_URL}/images/defaultProfPic.png` 
        : '/images/defaultProfPic.png';

    const getAvatarSrc = () => {
        if (!user.profile_picture) {
            return defaultFallbackPic;
        }

        // If it's already an absolute URL link or explicitly sloped from root, return it
        if (user.profile_picture.startsWith('http') || user.profile_picture.startsWith('/')) {
            return user.profile_picture;
        }

        // Handles plain database string definitions cleanly across deeper page refreshes
        return `/images/profilePics/${user.profile_picture}`;
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
                            src={getAvatarSrc()}
                            alt="User"
                            className="main-avatar"
                            onClick={() => navigate('/main/user-settings')}
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = user.profile_picture;
                            }}
                        />
                        <div className="online-indicator"></div>
                    </div>
                    <div className="profile-details">
                        <p className="profile-name" title={user.username}>{displayUsername}</p>
                    </div>
                </div>

                <div className="balance-card">
                    <div className="balance-info">
                        <Wallet size={14} className="wallet-icon" />
                        <span>Current Balance</span>
                    </div>
                    <p className="balance-amount">
                        {user.balance !== undefined ? `₱${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₱0.00"}
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
                    className={`nav-btn ${activeTab === 'rentings' || activeTab === 'leasing-information' ? 'active' : ''}`}
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