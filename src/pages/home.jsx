import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
    const [dateTime, setDateTime] = useState(new Date());
    const [username, setUsername] = useState('User');

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        // Format: Mon, Feb. 24, 2026
        return date.toLocaleDateString('en-US', options).replace(/,/g, '');
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

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
        <>
            <div className="welcome-container">
                <header className="main-header">
                    <div className="header-left">
                        <img src="/images/logo.png" alt="Logo" className="header-logo" />
                        <h1 className="header-title">Dorm Dash</h1>
                    </div>

                    <div className="header-middle">
                        <span className="date-display">{formatDate(dateTime)}</span>
                        <span className="time-display">{formatTime(dateTime)}</span>
                    </div>

                    <div className="header-right">
                        <div className="profile-section">
                            <div className="prof-pic-container">
                                <img src="/images/prof_pic.png" alt="Profile" className="prof-pic" />
                            </div>
                            <span className="profile-label">Profile</span>
                        </div>

                        <button className="logout-btn" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>
                </header>

                <main className="welcome-body">
                    <h2 className="welcome-msg">Welcome back, {username}!</h2>
                    <p className="welcome-subtext">You are now securely logged into the Dorm Dash Rental Management Portal.</p>
                </main>
            </div>
        </>
    );
}

export default Home;