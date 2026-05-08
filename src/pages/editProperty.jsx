import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Icons
import { ChevronLeft } from 'lucide-react';

// Services
import { updatePropertyInDB } from '../services/handlePropertyInformation';

export default function EditProperty() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();

    const property = location.state?.property;

    let imageslist = [];
    if (property) {
        try {
            if (typeof property.image_url === 'string') {
                if (property.image_url.startsWith('[')) {
                    imageslist = JSON.parse(property.image_url);
                } else if (property.image_url.includes('|')) {
                    imageslist = property.image_url.split('|').map(url => url.trim());
                } else {
                    imageslist = [property.image_url];
                }
            } else {
                imageslist = property.image_url || property.images || [];
            }
        } catch (e) {
            imageslist = property.image_url ? [property.image_url] : [];
        }
    }

    const [editForm, setEditForm] = useState({
        ...property,
        amenities: Array.isArray(property?.amenities) ? property.amenities.join(', ') : (property?.amenities || ''),
        image1: imageslist[0] || '',
        image2: imageslist[1] || '',
        image3: imageslist[2] || '',
        image4: imageslist[3] || '',
        image5: imageslist[4] || ''
    });

    if (!property) {
        return <p>Property not found. <button onClick={() => navigate('/main/my-properties')}>Go Back</button></p>;
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        const validImages = [editForm.image1, editForm.image2, editForm.image3, editForm.image4, editForm.image5]
            .map(s => s.trim())
            .filter(s => s !== '');

        const updatedProp = {
            ...property,
            ...editForm,
            price: Number(editForm.price),
            amenities: typeof editForm.amenities === 'string' ? editForm.amenities.split(',').map(s => s.trim()) : editForm.amenities,
            images: validImages, // Array for immediate frontend UI
            image_url: validImages.join('|') // Joined by | for the database
        };

        try {
            await updatePropertyInDB(updatedProp);
            alert('Property updated successfully!');
            navigate(`/main/my-properties/details/${propertyName}`, { state: { property: updatedProp } });
        } catch (error) {
            alert('Failed to update property.');
        }
        

        navigate(`/main/my-properties/details/${propertyName}`, { state: { property: updatedProp } });
    };

    return (
        <div className="page-layout">
            <div className="page-main">
                <div className="page-content">
                    <div className="my-properties-container">

                        <div className="property-form-wrapper" style={{ margin: '0 auto' }}>
                            <div className="property-form-header">
                                <button
                                    onClick={() => navigate(`/main/my-properties/details/${propertyName}`, { state: { property } })}
                                    className="property-form-back-btn"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="property-form-title">Edit Property Post</h2>
                            </div>

                            <form onSubmit={handleSaveEdit}>
                                <div className="property-form-grid">
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Property Name</label>
                                        <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Type of Place</label>
                                        <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="property-form-select">
                                            <option value="condo">Condo</option>
                                            <option value="dorm">Dorm</option>
                                            <option value="bedspace">Bedspace</option>
                                            <option value="boarding house">Boarding House</option>
                                        </select>
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Monthly Price (₱)</label>
                                        <input required type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Location Address</label>
                                        <input required type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Amenities (comma separated)</label>
                                        <input type="text" value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} className="property-form-input" />
                                    </div>

                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 1 (Main)</label>
                                        <textarea rows={2} value={editForm.image1} onChange={e => setEditForm({ ...editForm, image1: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 2</label>
                                        <textarea rows={2} value={editForm.image2} onChange={e => setEditForm({ ...editForm, image2: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 3</label>
                                        <textarea rows={2} value={editForm.image3} onChange={e => setEditForm({ ...editForm, image3: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 4</label>
                                        <textarea rows={2} value={editForm.image4} onChange={e => setEditForm({ ...editForm, image4: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 5</label>
                                        <textarea rows={2} value={editForm.image5} onChange={e => setEditForm({ ...editForm, image5: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>

                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Location Map/Area Image URL</label>
                                        <input type="text" value={editForm.locationImg} onChange={e => setEditForm({ ...editForm, locationImg: e.target.value })} className="property-form-input" />
                                    </div>
                                </div>
                                <button type="submit" className="property-form-submit-btn">Save Changes</button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}