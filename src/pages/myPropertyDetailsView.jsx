import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Icons
import { ChevronLeft, User } from 'lucide-react';

// Hooks
import useFetchTenants from "../hooks/fetchTenants";
import useManageLeasePendings from "../hooks/useManageLeasePendings"; 

// Services
import { changePropertyState } from "../services/changePropertyState";

export default function MyPropertyDetailsView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();

    const [currentProperty, setCurrentProperty] = useState(location.state?.property);

    const { tenants, isLoading } = useFetchTenants(currentProperty?.id);
    
    const processedTenants = useManageLeasePendings(tenants);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!currentProperty) {
        return (
            <div className="page-layout">
                <p>Property not found. <button onClick={() => navigate('/main/my-properties')}>Go Back</button></p>
            </div>
        );
    }

    if (isLoading) {
        return <div className="loading-spinner">Loading tenant data...</div>;
    }

    const handleStatusChange = async (newStatus) => {
        if (currentProperty.status === newStatus) return;

        const previousStatus = currentProperty.status;
        setCurrentProperty((prev) => ({ ...prev, status: newStatus }));

        try {
            const result = await changePropertyState(currentProperty.id, newStatus);

            if (result.success) {
                navigate(location.pathname, {
                    replace: true,
                    state: { ...location.state, property: { ...currentProperty, status: newStatus } }
                });
                alert(`Status successfully updated to ${newStatus}`);
            } else {
                throw new Error(result.message || "Backend update failed");
            }
        } catch (error) {
            setCurrentProperty((prev) => ({ ...prev, status: previousStatus }));
            alert("Failed to update status in the database. Please try again.");
        }
    };

    return (
        <div className="page-layout">
            <div className="page-main">
                <div className="page-content">
                    <div className="property-details-container">

                        <div className="property-details-header-card">
                            <button onClick={() => navigate('/main/my-properties')} className="property-form-back-btn">
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="property-details-title">Manage: {currentProperty.name}</h2>

                            <div className="property-details-actions">
                                <div className="property-details-status-group">
                                    <button
                                        onClick={() => handleStatusChange('available')}
                                        className={`property-details-status-btn ${currentProperty.status !== 'occupied' && currentProperty.status !== 'unavailable' ? 'active-available' : 'inactive'}`}
                                    >Available</button>
                                    <button
                                        onClick={() => handleStatusChange('occupied')}
                                        className={`property-details-status-btn ${currentProperty.status === 'occupied' ? 'active-occupied' : 'inactive'}`}
                                    >Fully Occupied</button>
                                    <button
                                        onClick={() => handleStatusChange('unavailable')}
                                        className={`property-details-status-btn ${currentProperty.status === 'unavailable' ? 'active-unavailable' : 'inactive'}`}
                                    >Unavailable</button>
                                </div>
                                <button
                                    onClick={() => navigate(`/main/my-properties/details/${propertyName}/edit-information`, { state: { property: currentProperty } })}
                                    className="property-details-edit-btn"
                                >
                                    Edit Post Information
                                </button>
                            </div>
                        </div>

                        <div className="property-details-tenants-section">
                            <div className="property-details-tenants-header">
                                <h3 className="property-details-tenants-title">
                                    <User style={{ color: '#0d9488' }} /> Tenants & Leases
                                </h3>
                            </div>
                            <div className="property-details-table-wrapper">
                                <table className="property-details-table">
                                    <thead>
                                        <tr>
                                            <th className="property-details-th">Tenant Name</th>
                                            <th className="property-details-th">Start Date</th>
                                            <th className="property-details-th">Occupancy</th>
                                            <th className="property-details-th">Lease Term</th>
                                            <th className="property-details-th text-right">Monthly Rate</th>
                                            <th className="property-details-th">Status</th>
                                            <th className="property-details-th text-right">Pending Pay</th>
                                            <th className="property-details-th text-right">Total Paid</th>
                                            <th className="property-details-th text-right">Total End Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedTenants.map((tenant) => (
                                            <tr key={tenant.id}>
                                                <td className="property-details-td tenant-name">{tenant.tenantName}</td>
                                                <td className="property-details-td" style={{ color: '#64748b' }}>
                                                    {formatDate(tenant.startDate)}
                                                </td>
                                                <td className="property-details-td">{tenant.occupancy}</td>
                                                <td className="property-details-td">{tenant.leaseTerm} months</td>
                                                
                                                <td className="property-details-td text-right">
                                                    ₱{Number(tenant.monthlyRate || 0).toLocaleString()}
                                                </td>

                                                <td className="property-details-td">
                                                    <span className={`property-details-badge ${
                                                        tenant.calculatedStatus === 'Pending' ? 'danger' : 
                                                        tenant.calculatedStatus === 'Advanced payment' ? 'info' : 'success'
                                                    }`}>
                                                        {tenant.calculatedStatus}
                                                    </span>
                                                </td>
                                                <td className={`property-details-td text-right ${tenant.calculatedPendingPayment > 0 ? 'text-danger' : ''}`}>
                                                    {tenant.calculatedPendingPayment > 0 
                                                        ? `₱${tenant.calculatedPendingPayment.toLocaleString()}` 
                                                        : 'None'
                                                    }
                                                </td>
                                                <td className="property-details-td text-right" style={{ fontWeight: '500' }}>
                                                    ₱{tenant.totalPaid.toLocaleString()}
                                                </td>
                                                <td className="property-details-td text-right">
                                                    ₱{tenant.totalDue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        
                                        {processedTenants.length === 0 && (
                                            <tr>
                                                <td colSpan="9" className="property-details-empty-row">
                                                    No tenants yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}