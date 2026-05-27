import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useParams, useOutletContext } from "react-router-dom";

// Icons
import { ChevronLeft, User, Trash2, History } from 'lucide-react';

// Components
import { ConfirmationModal } from '../components/confirmationModal.jsx';

// Services
import { propertyService, tenantService } from '../services/api';

// Hooks
import useManageLeasePendings from "../hooks/useManageLeasePendings";

export default function MyPropertyDetailsView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { propertyName } = useParams();

    const { showToast, setIsGlobalLoading } = useOutletContext();

    const [currentProperty, setCurrentProperty] = useState(location.state?.property);
    const [tenants, setTenants] = useState([]);
    console.log(tenants);
    const [isTenantsLoading, setIsTenantsLoading] = useState(true);
    const [isPropertyLoading, setIsPropertyLoading] = useState(!currentProperty);

    const fetchPropertyDetails = useCallback(async () => {
        if (!currentProperty?.id) return;
        try {
            const res = await propertyService.getById(currentProperty.id);
            if (res.data && res.data.success) {
                setCurrentProperty(res.data.data);
            } else if (res.data && !res.data.success && !location.state?.property) {
                showToast(res.data.message || "Failed to sync property details", "error");
            }
        } catch (error) {
            console.error("Failed to query fresh property information parameters:", error);
        } finally {
            setIsPropertyLoading(false);
        }
    }, [currentProperty?.id, location.state?.property, showToast]);

    const fetchPropertyTenants = useCallback(async () => {
        if (!currentProperty?.id) return;
        setIsTenantsLoading(true);
        try {
            const res = await tenantService.getByPropertyId(currentProperty.id);
            if (res.data && res.data.success) {
                setTenants(res.data.data || []);
            } else if (Array.isArray(res.data)) {
                setTenants(res.data);
            }
        } catch (error) {
            console.error("Failed to query property active lease directory:", error);
            showToast("Failed to reload tenants listing", "error");
        } finally {
            setIsTenantsLoading(false);
        }
    }, [currentProperty?.id, showToast]);

    useEffect(() => {
        if (currentProperty?.id) {
            fetchPropertyDetails();
            fetchPropertyTenants();
        }
    }, [currentProperty?.id, fetchPropertyDetails, fetchPropertyTenants]);

    const processedTenants = useManageLeasePendings(tenants);

    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    const isDeletable = useMemo(() => {
        if (!processedTenants || processedTenants.length === 0) return true;
        return processedTenants.every(t => (t.calculatedPendingPayment || 0) <= 0);
    }, [processedTenants]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const handleStatusChange = async (newStatus) => {
        if (currentProperty.status === newStatus) return;
        setIsGlobalLoading(true);
        try {
            const response = await propertyService.updateStatus(currentProperty.id, newStatus);
            if (response.data && response.data.success) {
                setCurrentProperty(prev => ({ ...prev, status: newStatus }));
                showToast("Status updated successfully", "success");
            } else {
                showToast(response.data?.message || "Failed to alter status state", "error");
            }
        } catch (error) {
            console.error("Status Change Failure Context:", error);
            showToast("Failed to update status", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleDeletePropertyClick = () => {
        if (!isDeletable) {
            showToast("Cannot delete property with active pending payments.", "error");
            return;
        }

        setModalConfig({
            isOpen: true,
            title: "Delete Property",
            message: `Are you sure you want to delete "${currentProperty.name}"? This action cannot be undone.`,
            confirmText: "Delete Permanently",
            isDestructive: true,
            onConfirm: () => executeDeleteProperty()
        });
    };

    const executeDeleteProperty = async () => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);
        try {
            const res = await propertyService.deleteProperty(currentProperty.id);
            if (res.data && res.data.success) {
                showToast("Property deleted successfully", "success");
                navigate('/main/my-properties');
            } else {
                showToast(res.data?.message || "Property elimination rejected by controller.", "error");
            }
        } catch (err) {
            showToast("An error occurred during deletion", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleRemoveTenantClick = (tenant) => {
        setModalConfig({
            isOpen: true,
            title: "Remove Tenant",
            message: `Are you sure you want to remove ${tenant.tenantName} from this property?`,
            confirmText: "Remove Tenant",
            isDestructive: true,
            onConfirm: () => executeRemoveTenant(tenant.id)
        });
    };

    const executeRemoveTenant = async (tenantId) => {
        setModalConfig({ isOpen: false });
        setIsGlobalLoading(true);
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const [res] = await Promise.all([
                tenantService.removeTenant(tenantId),
                minDelay
            ]);

            if (res.data && res.data.success) {
                showToast(res.data.message || "Tenant removed successfully", "success");
                fetchPropertyTenants();
            } else {
                showToast(res.data?.message || "Failed to remove tenant", "error");
            }
        } catch (err) {
            console.error("Frontend Crash in executeRemoveTenant:", err);
            showToast("An unexpected application error occurred.", "error");
        } finally {
            setIsGlobalLoading(false);
        }
    };

    const handleViewHistory = (tenant) => {
        const leaseData = {
            id: tenant.id,
            tenantId: tenant.tenant_id || tenant.tenantId,
            tenantName: tenant.tenantName,
            propertyId: currentProperty.id,
            ownerId: currentProperty.owner_id,
            propertyName: currentProperty.name,
            monthlyRate: tenant.monthlyRate,
            unitOccupancy: tenant.occupancy
        };
        console.log(leaseData)

        const occupancySlug = (tenant.occupancy || "n-a").toLowerCase().replace(/\s+/g, '-');
        navigate(`/main/tenant-transaction-history/${leaseData.ownerId}/${leaseData.propertyId}/${occupancySlug}`, {
            state: { leaseData }
        });
    };

    if (!currentProperty && !isPropertyLoading) return <div className="page-layout">Property not found.</div>;
    if (isTenantsLoading || isPropertyLoading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="page-layout" id="property-details-view">
            <ConfirmationModal {...modalConfig} onCancel={() => setModalConfig({ isOpen: false })} />

            <div className="page-main">
                <div className="page-content">
                    <div className="property-details-container">

                        <div className="property-details-header-card">
                            <div className="header-title-row">
                                <button onClick={() => navigate('/main/my-properties')} className="property-form-back-btn">
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="property-details-title">Manage: {currentProperty.name}</h2>

                                <button
                                    id="delete-property-main-btn"
                                    className={`action-icon-btn delete ${!isDeletable ? 'btn-disabled' : ''}`}
                                    onClick={handleDeletePropertyClick}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="property-details-actions">
                                <div className="property-details-status-group">
                                    {['available', 'occupied', 'unavailable'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusChange(s)}
                                            className={`property-details-status-btn ${currentProperty.status === s ? `active-${s}` : 'inactive'}`}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
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
                                            <th className="property-details-th">Unit Occupancy</th>
                                            <th className="property-details-th">Start Date</th>
                                            <th className="property-details-th">Lease Term</th>
                                            <th className="property-details-th text-right">Monthly Rate</th>
                                            <th className="property-details-th">Status</th>
                                            <th className="property-details-th text-right">Pending Pay</th>
                                            <th className="property-details-th text-right">Total Paid</th>
                                            <th className="property-details-th" style={{ textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedTenants.map((tenant) => (
                                            <tr key={tenant.id}>
                                                <td className="property-details-td tenant-name">{tenant.tenantName}</td>
                                                <td className="property-details-td">{tenant.occupancy || "N/A"}</td>
                                                <td className="property-details-td">{formatDate(tenant.startDate)}</td>
                                                <td className="property-details-td">{tenant.leaseTerm} months</td>
                                                <td className="property-details-td text-right">₱{Number(tenant.monthlyRate || 0).toLocaleString()}</td>
                                                <td className="property-details-td">
                                                    <span className={`property-details-badge ${tenant.calculatedStatus === 'Pending' ? 'danger' : 'success'}`}>
                                                        {tenant.calculatedStatus}
                                                    </span>
                                                </td>
                                                <td className={`property-details-td text-right ${tenant.calculatedPendingPayment > 0 ? 'text-danger' : ''}`}>
                                                    {tenant.calculatedPendingPayment > 0 ? `₱${tenant.calculatedPendingPayment.toLocaleString()}` : 'None'}
                                                </td>
                                                <td className="property-details-td text-right">₱{tenant.totalPaid.toLocaleString()}</td>
                                                <td className="property-details-td action-cell">
                                                    <div className="property-details-action-group">
                                                        <button
                                                            id={`view-history-btn-${tenant.id}`}
                                                            className="action-icon-btn history property-details-history-btn"
                                                            onClick={() => handleViewHistory(tenant)}
                                                            title="View Transaction History"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        <button
                                                            className="action-icon-btn remove-tenant"
                                                            onClick={() => handleRemoveTenantClick(tenant)}
                                                            title="Remove Tenant"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {processedTenants.length === 0 && (
                                            <tr>
                                                <td colSpan="9" className="property-details-empty-row">No active tenants.</td>
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