import React, { useState } from "react";

// Components
import LiveClock from "./liveClock.jsx";

// Hooks
import useFetchUser from "../hooks/fetchUser.jsx";

export default function Header({ activeTab }) {


    const [subView, setSubView] = useState(null);


    const user = useFetchUser();
    

    const navigateTo = (tab, sub = null) => {
        setSubView(sub);
    };

    return (
        <header className="top-header">
            <div className="mobile-brand">Dorm Dash</div>

            <div className="desktop-title-wrapper">
                <h2 className="desktop-title">
                    {activeTab.replace('-', ' ')}
                </h2>
            </div>

            <div className="header-center">
                <LiveClock />
            </div>

            <div className="header-right">
                <div className="user-info-text">
                    <p className="user-name">{user.username}</p>
                    <p className="user-balance">{user.balance ? `₱${user.balance.toLocaleString()}` : "error"}</p>
                </div>
                <button onClick={() => navigateTo('profile')} className="profile-btn">
                    <img src={user.profPic ? user.profPic : "/images/defaultProfPic.png"} alt="User" className="profile-img" />
                </button>
            </div>
        </header>
    );
}