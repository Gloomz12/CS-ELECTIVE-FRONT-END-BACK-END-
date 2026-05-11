import React, { useState } from "react";
import { useLocation, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ChevronLeft } from 'lucide-react';

// Services
import { updatePropertyInDB } from '../services/handlePropertyInformation';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

export default function EditProperty() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();
    const { showToast, setIsGlobalLoading } = useOutletContext();

    const property = location.state?.property;
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    let imageslist = [];
    if (property) {
        const url = property.image_url;
        if (typeof url === 'string') {
            imageslist = url.includes('|') ? url.split('|').map(u => u.trim()) : [url];
        } else {
            imageslist = url || [];
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

    if (!property) return <p>Not found. <button onClick={() => navigate('/main/my-properties')}>Go Back</button></p>;

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
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

        const validImages = [editForm.image1, editForm.image2, editForm.image3, editForm.image4, editForm.image5]
            .map(s => s.trim())
            .filter(s => s !== '');

        const updatedProp = {
            ...property,
            ...editForm,
            price: Number(editForm.price),
            amenities: editForm.amenities.split(',').map(s => s.trim()),
            images: validImages,
            image_url: validImages.join('|')
        };

        try {
            await Promise.all([updatePropertyInDB(updatedProp), minDelay]);
            showToast('Property listed successfully!', 'success');
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
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <div key={num} className="property-form-group property-form-col-span-2">
                                            <label className="property-form-label">Image URL {num}</label>
                                            <textarea rows={2} value={editForm[`image${num}`]} onChange={e => setEditForm({ ...editForm, [`image${num}`]: e.target.value })} className="property-form-textarea" />
                                        </div>
                                    ))}
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Map Image URL</label>
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