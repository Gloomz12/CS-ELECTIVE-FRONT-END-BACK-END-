import React, { useState, useEffect } from "react";

//COMPONENTS
import Header from '../components/header.jsx';
import Sidebar from '../components/sidebar.jsx';


export default function MyProperties() {

    const [activeTab, setActiveTab] = useState('my-properties');
    const [subView, setSubView] = useState(null);
    const navigateTo = (tab, sub = null) => {
        setActiveTab(tab);
        setSubView(sub);
    };


    return (
        <div id="app-container" className="app-layout">

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="content-wrapper">
                <Header activeTab={activeTab} />

                <main id="main-view" className="scrollable-content">
                    <h1>My Properties</h1>
                </main>
            </div>
        </div>
    );
}