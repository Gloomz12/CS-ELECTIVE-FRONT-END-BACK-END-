import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeft } from 'lucide-react';
import { ConfirmationModal } from '../components/confirmationModal.jsx';
import { userService, propertyService } from '../services/api.jsx';

export default function AddProperty() {
    const navigate = useNavigate();
    const { showToast, setIsGlobalLoading } = useOutletContext();
    const [user, setUser] = useState({});
    const [form, setForm] = useState({
        name: '', type: 'condo', location: '', price: '',
        amenities: '', locationImg: '',
        image1: '', image2: '', image3: '', image4: '', image5: ''
    });
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await userService.getProfile();
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user");
            }
        };
        fetchUser();
    }, []);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setModalConfig({
            isOpen: true,
            title: "Publish Listing",
            message: "Are you sure you want to post this property?",
            confirmText: "Publish",
            onConfirm: executeSubmit
        });
    };

    const executeSubmit = async () => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);

        const validImages = [form.image1, form.image2, form.image3, form.image4, form.image5]
            .map(s => s.trim())
            .filter(s => s !== '');

        const newProp = {
            owner_id: user.id,
            name: form.name,
            type: form.type,
            price_monthly: Number(form.price),
            location_address: form.location,
            image_url: validImages.join('|'),
            map_image_url: form.locationImg.trim() || 'https://images.unsplash.com/photo-1524661135-423995f22d0b',
            amenities: form.amenities
        };

        try {
            await propertyService.addProperty(newProp);
            showToast('Property listed successfully!', 'success');
            navigate('/main/my-properties');
        } catch (error) {
            showToast('Failed to add property.', 'error');
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
                        <div className="property-form-wrapper">
                            <div className="property-form-header">
                                <button onClick={() => navigate('/main/my-properties')} className="property-form-back-btn">
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="property-form-title">Post a New Property</h2>
                            </div>
                            <form onSubmit={handleFormSubmit}>
                                <div className="property-form-grid">
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Property Name</label>
                                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Type</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="property-form-select">
                                            <option value="condo">Condo</option>
                                            <option value="dorm">Dorm</option>
                                            <option value="bedspace">Bedspace</option>
                                            <option value="boarding house">Apartment</option>
                                        </select>
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Monthly Price (₱)</label>
                                        <input required type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Location</label>
                                        <input required type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Amenities</label>
                                        <input type="text" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} className="property-form-input" />
                                    </div>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <div key={num} className="property-form-group property-form-col-span-2">
                                            <label className="property-form-label">Image URL {num}</label>
                                            <textarea rows={2} value={form[`image${num}`]} onChange={e => setForm({ ...form, [`image${num}`]: e.target.value })} className="property-form-textarea" />
                                        </div>
                                    ))}
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Map Image URL</label>
                                        <input type="text" value={form.locationImg} onChange={e => setForm({ ...form, locationImg: e.target.value })} className="property-form-input" />
                                    </div>
                                </div>
                                <button type="submit" className="property-form-submit-btn">Publish Listing</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}