import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Icons
import { ChevronLeft } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser.jsx';
import { addPropertyToDB } from '../services/handlePropertyInformation';


export default function AddProperty() {
    const navigate = useNavigate();
    const user = useFetchUser() || {};

    const [form, setForm] = useState({
        name: '', type: 'condo', location: '', price: '',
        amenities: '', locationImg: '',
        image1: '', image2: '', image3: '', image4: '', image5: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validImages = [form.image1, form.image2, form.image3, form.image4, form.image5]
            .map(s => s.trim())
            .filter(s => s !== '');

        if (validImages.length === 0) {
            validImages.push('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80');
        }

        const newProp = {
            id: 'p_' + Date.now(),
            ...form,
            price: Number(form.price),
            status: 'available',
            amenities: form.amenities.split(',').map(s => s.trim()),
            images: validImages,
            image_url: validImages.join('|'),
            locationImg: form.locationImg.trim() || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
            ownerId: user.id,
            ownerName: user.username
        };

        try {
            await addPropertyToDB(newProp);
            alert('Property Added successfully!');
            navigate('/main/my-properties');
        } catch (error) {
            alert('Failed to add property.');
        }

        navigate('/main/my-properties');
    };

    return (
        <div className="page-layout">
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

                            <form onSubmit={handleSubmit}>
                                <div className="property-form-grid">
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Property Name</label>
                                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group">
                                        <label className="property-form-label">Type of Place</label>
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
                                        <label className="property-form-label">Location Address</label>
                                        <input required type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="property-form-input" />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Amenities (comma separated)</label>
                                        <input placeholder="e.g. WiFi, Pool, Gym" type="text" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} className="property-form-input" />
                                    </div>

                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 1 (Main)</label>
                                        <textarea rows={2} value={form.image1} onChange={e => setForm({ ...form, image1: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 2</label>
                                        <textarea rows={2} value={form.image2} onChange={e => setForm({ ...form, image2: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 3</label>
                                        <textarea rows={2} value={form.image3} onChange={e => setForm({ ...form, image3: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 4</label>
                                        <textarea rows={2} value={form.image4} onChange={e => setForm({ ...form, image4: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>
                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Image URL 5</label>
                                        <textarea rows={2} value={form.image5} onChange={e => setForm({ ...form, image5: e.target.value })} className="property-form-textarea" placeholder="https://..." />
                                    </div>

                                    <div className="property-form-group property-form-col-span-2">
                                        <label className="property-form-label">Location Map/Area Image URL</label>
                                        <input placeholder="https://map-image.jpg" type="text" value={form.locationImg} onChange={e => setForm({ ...form, locationImg: e.target.value })} className="property-form-input" />
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