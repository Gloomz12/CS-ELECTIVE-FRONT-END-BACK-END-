import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Icons
import { Wallet, Building, Users, Inbox, Calendar, FileText, Send, ArrowRight, AlertCircle } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser';
import useFetchProperties from '../hooks/fetchProperties';
import useFetchRentings from '../hooks/fetchRentings'; 

// Services 
import { fetchInquiries } from '../services/handleInquiries'; 

export default function Home() {
    const navigate = useNavigate();

    const currentUser = useFetchUser();
    const userId = currentUser?.id || localStorage.getItem("userId");
    const allProperties = useFetchProperties();
    const { rentings: allRentings } = useFetchRentings();

    const [allInquiries, setAllInquiries] = useState([]);
    const [allLandlordTenants, setAllLandlordTenants] = useState([]);
    const [isLoadingTenants, setIsLoadingTenants] = useState(true);

    const myOwnedProperties = useMemo(() => {
        return allProperties?.filter(prop => String(prop.owner_id) === String(userId)) || [];
    }, [allProperties, userId]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const inquiryData = await fetchInquiries();
                setAllInquiries(inquiryData || []);

                if (myOwnedProperties.length > 0) {
                    const tenantRequests = myOwnedProperties.map(prop => 
                        axios.post("http://localhost/api/tenants/fetchTenants.php", {
                            property_id: prop.id
                        })
                    );

                    const responses = await Promise.all(tenantRequests);
                    
                    const aggregatedTenants = responses.flatMap(res => {
                        if (res.data.success) {
                            return res.data.data.map(t => ({
                                ...t,
                                pendingPayment: parseFloat(t.pending_payment || 0)
                            }));
                        }
                        return [];
                    });

                    setAllLandlordTenants(aggregatedTenants);
                }
            } catch (error) {
                console.error("Dashboard Data Fetch Error:", error);
            } finally {
                setIsLoadingTenants(false);
            }
        };

        if (userId) {
            fetchDashboardData();
        }
        document.title = "Dashboard | Dorm Dash";
    }, [userId, myOwnedProperties]);

    const stats = useMemo(() => {
        const totalTenantsCount = allLandlordTenants.length;

        const pendingInquiriesReceived = allInquiries?.filter(inq =>
            inq.status === 'pending' &&
            myOwnedProperties.some(prop => String(prop.id) === String(inq.property_id))
        ).length || 0;

        const myUnpaidDuesCount = allRentings.filter(r => {
            const pendingAmount = parseFloat(r.pending_payment || r.pendingPayment || 0);
            return pendingAmount > 0;
        }).length;

        const pendingInquiriesSent = allInquiries?.filter(inq => 
            String(inq.tenant_id) === String(userId) && 
            inq.status === 'pending'
        ).length || 0;

        return {
            userName: currentUser?.username || "Guest",
            balance: currentUser?.balance ? parseFloat(currentUser.balance) : 0,
            totalProperties: myOwnedProperties.length,
            totalTenants: totalTenantsCount,
            pendingInquiriesReceived: pendingInquiriesReceived,
            totalRentings: allRentings.length,
            unpaidDues: myUnpaidDuesCount,
            pendingInquiriesSent: pendingInquiriesSent,
        };
    }, [myOwnedProperties, allInquiries, allRentings, allLandlordTenants, currentUser, userId]);

    return (
        <div className="home-dashboard-container">
            <section className="dashboard-welcome-banner">
                <div className="banner-content">
                    <h1 className="banner-title">Welcome back, {stats.userName}!</h1>
                    <p className="banner-subtitle">
                        {stats.totalProperties > 0 
                            ? `Managing ${stats.totalProperties} properties with ${stats.totalTenants} total tenants.`
                            : `Find your perfect stay. You have ${stats.totalRentings} active rentals.`}
                    </p>
                </div>
                <div className="banner-actions">
                    <button onClick={() => navigate('/main/listings')} className="btn-browse-rooms">
                        Browse New Rooms <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            <section className="dashboard-section">
                <h2 className="section-title">Financial Overview</h2>
                <div className="stat-card balance-card">
                    <div className="stat-icon-wrapper bg-emerald-light text-emerald">
                        <Wallet size={28} />
                    </div>
                    <div className="stat-details">
                        <h3 className="stat-label">Total Wallet Balance</h3>
                        <p className="stat-value balance-value">
                            ₱{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </section>

            <div className="dashboard-split-grid">
                <section className="dashboard-section">
                    <h2 className="section-title">Landlord Overview</h2>
                    <div className="dashboard-grid grid-cols-2">
                        <div className="stat-card" onClick={() => navigate('/main/my-properties')}>
                            <div className="stat-icon-wrapper bg-blue-light text-blue"><Building size={24} /></div>
                            <div className="stat-details">
                                <h3 className="stat-label">My Properties</h3>
                                <p className="stat-value">{stats.totalProperties}</p>
                            </div>
                        </div>

                        <div className="stat-card" onClick={() => navigate('/main/my-properties')}>
                            <div className="stat-icon-wrapper bg-purple-light text-purple"><Users size={24} /></div>
                            <div className="stat-details">
                                <h3 className="stat-label">Total Tenants</h3>
                                <p className="stat-value">{stats.totalTenants}</p>
                            </div>
                        </div>

                        <div className="stat-card col-span-full border-rose" onClick={() => navigate('/main/my-properties/inquires-list')}>
                            <div className="stat-icon-wrapper bg-rose-light text-rose"><Inbox size={24} /></div>
                            <div className="stat-details flex-1">
                                <h3 className="stat-label">Received Inquiries</h3>
                                <div className="flex-between">
                                    <p className="stat-value">{stats.pendingInquiriesReceived}</p>
                                    {stats.pendingInquiriesReceived > 0 && <span className="badge badge-rose">New Inquiries</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tenant Overview */}
                <section className="dashboard-section">
                    <h2 className="section-title">Tenant Overview</h2>
                    <div className="dashboard-grid grid-cols-2">
                        <div className="stat-card" onClick={() => navigate('/main/rentings')}>
                            <div className="stat-icon-wrapper bg-teal-light text-teal"><Calendar size={24} /></div>
                            <div className="stat-details">
                                <h3 className="stat-label">My Renting</h3>
                                <p className="stat-value">{stats.totalRentings}</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-wrapper bg-amber-light text-amber"><Send size={24} /></div>
                            <div className="stat-details">
                                <h3 className="stat-label">Sent Inquiries</h3>
                                <p className="stat-value">{stats.pendingInquiriesSent}</p>
                            </div>
                        </div>

                        <div className="stat-card col-span-full border-amber" onClick={() => navigate('/main/rentings')}>
                            <div className="stat-icon-wrapper bg-orange-light text-orange"><FileText size={24} /></div>
                            <div className="stat-details flex-1">
                                <h3 className="stat-label">Unpaid Dues</h3>
                                <div className="flex-between">
                                    <p className="stat-value">{stats.unpaidDues}</p>
                                    {stats.unpaidDues > 0 && (
                                        <span className="badge badge-amber">
                                            <AlertCircle size={14} /> Check Payments
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}