import React from "react";

// Components
import LiveClock from "./liveClock.jsx";

export default function Header({ activeTab }) {
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

            <div className="header-right"></div>
        </header>
    );
}