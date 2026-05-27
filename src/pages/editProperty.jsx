import React, { useState } from "react";
import { useLocation, useNavigate, useParams, useOutletContext } from "react-router-dom";

// Icons
import { ChevronLeft } from 'lucide-react';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

// Services
import { propertyService } from '../services/api.jsx';


export default function EditProperty() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast, setIsGlobalLoading } = useOutletContext();

    const property = location.state?.property;
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    let imageslist = [];
    if (property?.image_url) {
        imageslist = typeof property.image_url === 'string' 
            ? property.image_url.split('|').map(u => u.trim()) 
            : property.image_url;
    }

    const [editForm, setEditForm] = useState({
        ...property,
        price: property?.price_monthly || '', 
        location: property?.location_address || '', 
        locationImg: property?.map_image_url || '', 
        amenities: Array.isArray(property?.amenities) ? property.amenities.join(', ') : (property?.amenities || ''),
        image1: imageslist[0] || '',
        image2: imageslist[1] || '',
        image3: imageslist[2] || '',
        image4: imageslist[3] || '',
        image5: imageslist[4] || ''
    });

    if (!property) return <p>Not found. <button onClick={() => navigate('/main/my-properties')}>Go Back</button></p>;

    const handleMultipleImages = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        const newForm = { ...editForm };
        // Reset current images
        for (let i = 1; i <= 5; i++) newForm[`image${i}`] = '';
        
        files.forEach((file, index) => {
            newForm[`image${index + 1}`] = `/images/properties/${file.name}`;
        });
        setEditForm(newForm);
    };

    const handleMapFileChange = (e) => {
        if (e.target.files[0]) {
            setEditForm(prev => ({ ...prev, locationImg: `/images/maps/${e.target.files[0].name}` }));
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setModalConfig({
            isOpen: true,
            title: "Save Changes",
            message: "Update property details?",
            confirmText: "Update",
            onConfirm: executeSaveEdit
        });
    };

    const executeSaveEdit = async () => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);

        const validImages = [editForm.image1, editForm.image2, editForm.image3, editForm.image4, editForm.image5]
            .map(s => s.trim())
            .filter(s => s !== '');

        const updatedProp = {
            id: property.id,
            name: editForm.name,
            type: editForm.type,
            price_monthly: Number(editForm.price),
            location_address: editForm.location,
            map_image_url: editForm.locationImg,
            image_url: validImages.join('|'),
            amenities: editForm.amenities
        };

        try {
            await propertyService.updateProperty(property.id, updatedProp);
            showToast('Property updated successfully!', 'success');
            navigate('/main/my-properties');
        } catch (error) {
            showToast('Failed to edit property.', 'error');
        } finally {
            setIsGlobalLoading(false);
        }
    };

    return (
        <div className="page-layout">
            <ConfirmationModal {...modalConfig} onCancel={() => setModalConfig({ isOpen: false })} />
            <div className="page-main">
                <div className="page-content">
                    <div className="my-properties-container">
                        <div className="property-form-wrapper" style={{ margin: '0 auto' }}>
                            <div className="property-form-header">
                                <button onClick={() => navigate(-1)} className="property-form-back-btn">
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="property-form-title">Edit Property</h2>
                            </div>

                            <form onSubmit={handleFormSubmit}>
                                <div className="property-form-grid">
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Property Name</label>
                                        <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Type</label>
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
                                        <label className="property-form-label">Address</label>
                                        <input required type="text" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Amenities</label>
                                        <input type="text" value={editForm.amenities} onChange={e => setEditForm({ ...editForm, amenities: e.target.value })} className="property-form-input" />
                                    </div>

                                    {/* Updated Image Upload Section */}
                                    <div className="property-form-group property-form-col-span-2" id="image-upload-section">
                                        <label className="property-form-label">Property Images</label>
                                        <div className="upload-container">
                                            <label htmlFor="multi-image-input" className="custom-upload-btn">Change Images</label>
                                            <input id="multi-image-input" type="file" multiple accept="image/*" onChange={handleMultipleImages} hidden />
                                        </div>
                                        <div className="preview-grid">
                                            {[1, 2, 3, 4, 5].map(num => editForm[`image${num}`] && (
                                                <div key={num} className="image-preview-card">
                                                    <img src={editForm[`image${num}`]} alt={`Preview ${num}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="property-form-group property-form-col-span-2" id="map-upload-section">
                                        <label className="property-form-label">Map Location</label>
                                        <div className="upload-container">
                                            <label htmlFor="map-input" className="custom-upload-btn">Change Map Image</label>
                                            <input id="map-input" type="file" accept="image/*" onChange={handleMapFileChange} hidden />
                                        </div>
                                        {editForm.locationImg && (
                                            <div className="map-preview-card">
                                                <img src={editForm.locationImg} alt="Map Preview" onError={(e) => e.target.style.display = 'none'} />
                                                <p className="file-path-text">{editForm.locationImg}</p>
                                            </div>
                                        )}
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