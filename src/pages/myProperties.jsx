import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

// Icons
import { Plus, MessageSquare } from 'lucide-react';

// Hooks
import UseFetchProperties from '../hooks/fetchProperties.jsx';
import fetchUser from '../hooks/fetchUser.jsx';

// Services
import { fetchInquiries } from '../services/handleInquiries.jsx';

export default function MyProperties() {
    const navigate = useNavigate();
    const { setIsGlobalLoading } = useOutletContext();
    const currentUser = fetchUser();
    const properties = UseFetchProperties();
    const [allInquiries, setAllInquiries] = useState([]);

    useEffect(() => {
        const getInquiries = async () => {
            setIsGlobalLoading(true);
            try {
                const data = await fetchInquiries();
                if (Array.isArray(data)) {
                    setAllInquiries(data);
                }
            } catch (error) {
                console.error("Error in fetchInquiries service:", error);
            } finally {
                setIsGlobalLoading(false);
            }
        };
        getInquiries();
    }, [setIsGlobalLoading]);

    const ownedProperties = properties.filter(prop => String(prop.owner_id) === String(currentUser?.id));

    const pendingInquiries = allInquiries.filter(inquiry =>
        inquiry.status === 'pending' &&
        ownedProperties.some(prop => String(prop.id) === String(inquiry.property_id))
    );

    const inquiriesCount = pendingInquiries.length;

    const getFirstImage = (urlData) => {
        if (!urlData) return "/placeholder.jpg";
        try {
            if (typeof urlData === 'string') {
                if (urlData.startsWith('[')) {
                    const parsed = JSON.parse(urlData);
                    return Array.isArray(parsed) ? parsed[0] : urlData;
                }
                if (urlData.includes('|')) {
                    return urlData.split('|')[0].trim();
                }
                return urlData;
            }
            return Array.isArray(urlData) ? urlData[0] : urlData;
        } catch (e) {
            return urlData;
        }
    };

    return (
        <div className="page-layout">
            <div className="page-main">
                <div className="page-content">
                    <div className="my-properties-container">
                        <h1 className="my-properties-header-title">My Properties Manager</h1>

                        <div className="my-properties-nav-bar">
                            <button className="my-properties-nav-btn active">Listed Properties</button>
                            <button
                                onClick={() => navigate('/main/my-properties/add-property')}
                                className="my-properties-nav-btn inactive"
                            >
                                <Plus size={16} /> Add Property
                            </button>
                            <button
                                onClick={() => navigate('/main/my-properties/inquires-list')}
                                className="my-properties-nav-btn inactive"
                            >
                                <MessageSquare size={16} /> Inquiries ({inquiriesCount})
                            </button>
                        </div>

                        <div className="my-properties-grid">
                            {ownedProperties.map(prop => {
                                const displayImage = getFirstImage(prop.image_url);
                                return (
                                    <div key={prop.id} className="my-properties-card">
                                        <div className="my-properties-img-wrapper">
                                            <img src={displayImage} className="my-properties-img" alt={prop.name} />
                                        </div>
                                        <div className="my-properties-card-content">
                                            <div>
                                                <div className="my-properties-badge-type">{prop.type}</div>
                                                <h3 className="my-properties-card-title">{prop.name}</h3>
                                                <p className="my-properties-card-subtitle">
                                                    {prop.location_address} • ₱{parseFloat(prop.price_monthly).toLocaleString()}/mo
                                                </p>
                                            </div>
                                            <div className="my-properties-card-actions">
                                                <button
                                                    onClick={() => navigate(`/main/my-properties/details/${encodeURIComponent(prop.name.toLowerCase().replace(/\s+/g, '-'))}`, { state: { property: prop } })}
                                                    className="my-properties-manage-btn"
                                                >
                                                    Manage & View Tenants
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {ownedProperties.length === 0 && (
                                <p className="my-properties-empty-msg">You haven't listed any properties yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}