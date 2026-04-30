import React, { useState, useEffect } from 'react';
import axios from 'axios';

//COMPONENTS
import Header from '../components/header.jsx';
import Sidebar from '../components/sidebar.jsx';
import Toast from '../components/toast.jsx';

function Home() {

    const [dateTime, setDateTime] = useState(new Date());


    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
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

    const [activeTab, setActiveTab] = useState('listings');

    return (
        <div id="app-container" className="app-layout">

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="content-wrapper">
                <Header activeTab={activeTab} handleLogout={handleLogout} />

                <main id="main-view" className="scrollable-content">
                </main>
            </div>
        </div>
    );
}

export default Home;