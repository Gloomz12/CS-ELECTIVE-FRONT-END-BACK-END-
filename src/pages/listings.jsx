import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

// COMPONENTS
import Header from '../components/header.jsx';
import Sidebar from '../components/sidebar.jsx';

// SERVICES
import { userService, propertyService } from '../services/api';

// ICONS
import { MapPin } from 'lucide-react';

export default function Listings() {
    const navigate = useNavigate();
    const { setIsGlobalLoading } = useOutletContext(); 

    const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

    const [properties, setProperties] = useState([]);
    const [user, setUser] = useState(null);
    const [category, setCategory] = useState('all');
    const [sortOrder, setSortOrder] = useState('none');

    const categories = ['all', 'condo', 'dorm', 'bedspace', 'boarding house'];

    useEffect(() => {
        const fetchListingsData = async () => {
            setIsGlobalLoading(true);
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const [profileRes, propertiesRes] = await Promise.all([
                    userService.getProfile(userId),
                    propertyService.getAll()
                ]);

                if (profileRes.data && profileRes.data.success) {
                    setUser(profileRes.data.data || profileRes.data);
                }

                if (propertiesRes.data && propertiesRes.data.success) {
                    setProperties(propertiesRes.data.data || []);
                } else if (propertiesRes.data) {
                    setProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data.data || []);
                }

                await minDelay;
            } catch (error) {
                console.error("Listings Data Synchronization Failure:", error);
            } finally {
                setIsGlobalLoading(false);
            }
        };

        fetchListingsData();
    }, [userId, setIsGlobalLoading]);

    const filtered = Array.isArray(properties) ? properties.filter(p => {
        const matchesCategory = category === 'all' || p.type === category;
        return matchesCategory;
    }) : [];

    const sortedProperties = [...filtered].sort((a, b) => {
        const aAvail = (a.status === 'occupied' || a.status === 'unavailable') ? 1 : 0;
        const bAvail = (b.status === 'occupied' || b.status === 'unavailable') ? 1 : 0;
        if (aAvail !== bAvail) return aAvail - bAvail;

        if (sortOrder === 'asc') return a.price_monthly - b.price_monthly;
        if (sortOrder === 'desc') return b.price_monthly - a.price_monthly;
        return 0;
    });

    const getFirstImage = (urlData) => {
        if (!urlData) return "/images/defaultProperty.png";
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
        <div className="content-wrapper">
            <div className="listings-container">
                <div className="listings-controls">
                    <div className="filter-actions">
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="sort-dropdown"
                        >
                            <option value="none">Sort by Default</option>
                            <option value="asc">Price: Low to High</option>
                            <option value="desc">Price: High to Low</option>
                        </select>
                        <div className="category-list">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`category-button ${category === cat ? 'active' : ''}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="listings-grid">
                    {sortedProperties.map(prop => {
                        const isAvailable = prop.status !== 'unavailable';
                        const isOccupied = prop.status === 'occupied';
                        const urlName = prop.name.toLowerCase().replace(/\s+/g, '-');
                        const displayImage = getFirstImage(prop.image_url);

                        return (
                            <div
                                key={prop.id}
                                onClick={() => navigate(`/main/properties/${urlName}`, { state: { propertyData: prop } })}
                                className="property-card"
                            >
                                <div className="card-media">
                                    <img
                                        src={displayImage}
                                        alt={prop.name}
                                        className={`property-image ${isAvailable ? '' : isOccupied ? 'occupied-filter' : 'unavailable-filter'}`}
                                    />
                                    <div className="type-badge">{prop.type}</div>
                                    {isOccupied && (
                                        <div className="status-overlay">
                                            <span className="status-occupied">{prop.status}</span>
                                        </div>
                                    )}
                                    {!isAvailable && (
                                        <div className="status-overlay">
                                            <span className="status-unavailable">{prop.status}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h3 className="property-name">{prop.name}</h3>
                                    <p className="property-location">
                                        <MapPin size={16} /> {prop.location_address}
                                    </p>
                                    <div className="card-footer">
                                        <div className="price-display">
                                            <span className="price-amount">₱{Number(prop.price_monthly).toLocaleString()}</span>
                                            <span className="price-period">/mo</span>
                                        </div>
                                        <button className="view-details-btn">View</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}