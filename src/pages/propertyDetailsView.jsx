import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { ChevronLeft, MapPin, CheckCircle } from 'lucide-react';
import useFetchUser from '../hooks/fetchUser';
import UseFetchProperties from '../hooks/fetchProperties';

export default function PropertyDetailsView() {
    const { propertyName } = useParams();
    const { setIsGlobalLoading } = useOutletContext(); 
    const location = useLocation();
    const navigate = useNavigate();
    const user = useFetchUser();

    const allProperties = UseFetchProperties();
    const locationProperty = location.state?.propertyData;

    const property = allProperties.find(p => {
        const formattedName = p.name.toLowerCase().replace(/\s+/g, '-');
        return formattedName === propertyName;
    }) || locationProperty;

    useEffect(() => {
        let timer;
        if (!property) {
            setIsGlobalLoading(true);
        } else {
            timer = setTimeout(() => {
                setIsGlobalLoading(false);
            }, 1000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [property, setIsGlobalLoading]);

    if (!property) {
        return (
            <div className="property-view-not-found">
                <h2>Property not found.</h2>
                <button onClick={() => navigate('/main/listings')}>Go back to Listings</button>
            </div>
        );
    }

    const isUnavailable = property.status === 'occupied' || property.status === 'unavailable';
    const currentOwner = property.owner_id === user.id;

    let amenitiesList = [];
    try {
        amenitiesList = typeof property.amenities === 'string'
            ? JSON.parse(property.amenities)
            : property.amenities || [];
    } catch (e) {
        amenitiesList = property.amenities ? property.amenities.split(',') : [];
    }

    let imageslist = [];
    try {
        if (typeof property.image_url === 'string') {
            if (property.image_url.startsWith('[')) {
                imageslist = JSON.parse(property.image_url);
            }
            else if (property.image_url.includes('|')) {
                imageslist = property.image_url.split('|').map(url => url.trim());
            }
            else {
                imageslist = [property.image_url];
            }
        } else {
            imageslist = property.image_url || [];
        }
    } catch (e) {
        imageslist = property.image_url ? [property.image_url] : [];
    }

    return (
        <div id="property-view-page" className="property-view-wrapper">
            <div className="property-view-card-container">
                <header className="property-view-header">
                    <button onClick={() => navigate('/main/listings')} className="property-view-icon-btn">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="property-view-header-title">Property Details</h2>
                </header>

                <div className="property-view-main-content">
                    <div className="property-view-title-section">
                        <div className="property-view-title-group">
                            <div className="property-view-type-badge">{property.type}</div>
                            <h1 className="property-view-main-name">{property.name}</h1>
                            <p className="property-view-location-text">
                                <MapPin size={20} /> {property.location_address}
                            </p>
                        </div>
                    </div>

                    <div className={`property-view-image-grid ${imageslist.length === 1 ? 'grid-1' :
                        imageslist.length === 2 ? 'grid-2' :
                            imageslist.length === 3 ? 'grid-3' :
                                imageslist.length >= 4 ? 'grid-4' : ''
                        }`}>
                        {imageslist.length > 0 ? (
                            imageslist.slice(0, 5).map((img, index) => (
                                <div
                                    key={index}
                                    className={`property-view-grid-item ${index === 0 ? 'property-view-grid-main' : ''}`}
                                >
                                    <img src={img} alt={`Property view ${index + 1}`} />
                                </div>
                            ))
                        ) : (
                            <div className="property-view-grid-item property-view-grid-main">
                                <div className="property-view-placeholder">No Images Available</div>
                            </div>
                        )}
                    </div>

                    <div className="property-view-layout-grid">
                        <div className="property-view-left-column">
                            <section className="property-view-info-block">
                                <h3 className="property-view-section-title">
                                    <CheckCircle size={20} className="property-view-accent-teal" /> Amenities
                                </h3>
                                <div className="property-view-amenities-list">
                                    {amenitiesList.map((am, i) => (
                                        <div key={i} className="property-view-amenity-item">
                                            <div className="property-view-bullet"></div> {am}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="property-view-info-block">
                                <h3 className="property-view-section-title">
                                    <MapPin size={20} className="property-view-accent-teal" /> Location
                                </h3>
                                <img
                                    src={property.map_image_url}
                                    alt="Map location"
                                    className="property-view-map-static"
                                />
                            </section>
                        </div>

                        <div className="property-view-right-column">
                            <div className="property-view-landlord-card">
                                <div className="property-view-avatar-wrapper">
                                    <img
                                        src={property.profile_picture || "/images/defaultProfPic.png"}
                                        alt="Landlord profile"
                                        className="property-view-landlord-avatar"
                                    />
                                    <div className="property-view-avatar-badge" title="Verified Landlord"></div>
                                </div>

                                <h4 className="property-view-landlord-name">Owner: {property.full_name === null ? property.username : property.full_name}</h4>
                                <p className="property-view-landlord-sub">Property Landlord</p>

                                <button
                                    disabled={isUnavailable || currentOwner}
                                    className={`property-view-action-button ${isUnavailable || currentOwner ? 'property-view-btn-disabled' : 'property-view-btn-active'}`}
                                    onClick={() => navigate(`/main/properties/${property.name.toLowerCase().replace(/\s+/g, '-')}/inquire`, { state: { currentProperty: property } })}
                                >
                                    {isUnavailable ? 'Currently Unavailable' : currentOwner ? 'Invalid Action' : `Inquire Now - ₱${Number(property.price_monthly).toLocaleString()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}