import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';

// Icons
import { Wallet, Building, Users, Inbox, Calendar, FileText, Send, ArrowRight, AlertCircle } from 'lucide-react';

// Hooks
import useFetchUser from '../hooks/fetchUser';
import useFetchProperties from '../hooks/fetchProperties';
import useFetchRentings from '../hooks/fetchRentings';
import useManageLeasePendings from '../hooks/useManageLeasePendings';

// Services 
import { fetchInquiries } from '../services/handleInquiries';

export default function Home() {
    const navigate = useNavigate();
    const { setIsGlobalLoading } = useOutletContext();

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

    const processedLandlordTenants = useManageLeasePendings(useMemo(() => {
        return allLandlordTenants.map(t => ({
            ...t,
            startDate: t.startDate || t.start_date,
            monthlyRate: parseFloat(t.monthlyRate || t.monthly_rate || 0),
            totalPaid: parseFloat(t.totalPaid || t.total_paid || 0),
            leaseTerm: parseInt(t.leaseTerm || t.lease_term || 0),
            totalDue: parseFloat(t.totalDue || t.total_due || 0)
        }));
    }, [allLandlordTenants]));

    const processedMyRentings = useManageLeasePendings(useMemo(() => {
        return allRentings.map(r => ({
            ...r,
            startDate: r.startDate || r.start_date,
            monthlyRate: parseFloat(r.monthlyRate || r.monthly_rate || 0),
            totalPaid: parseFloat(r.totalPaid || r.total_paid || 0),
            leaseTerm: parseInt(r.leaseTerm || r.lease_term || 0),
            totalDue: parseFloat(r.totalDue || r.total_due || 0)
        }));
    }, [allRentings]));

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsGlobalLoading(true);
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const [inquiryData] = await Promise.all([
                    fetchInquiries(),
                    minDelay
                ]);

                setAllInquiries(inquiryData || []);

                if (myOwnedProperties.length > 0) {
                    const tenantRequests = myOwnedProperties.map(prop =>
                        axios.post("http://localhost/api/tenants/fetchTenants.php", { property_id: prop.id })
                    );
                    const responses = await Promise.all(tenantRequests);
                    const aggregatedTenants = responses.flatMap(res => res.data.success ? res.data.data : []);
                    setAllLandlordTenants(aggregatedTenants);
                }
            } catch (error) {
                console.error("Dashboard Data Fetch Error:", error);
            } finally {
                setIsGlobalLoading(false);
            }
        };

        if (userId) fetchDashboardData();
    }, [userId, myOwnedProperties, setIsGlobalLoading]);

    const stats = useMemo(() => {
        const totalTenantsCount = processedLandlordTenants.length;

        const pendingInquiriesReceived = allInquiries?.filter(inq =>
            inq.status === 'pending' &&
            myOwnedProperties.some(prop => String(prop.id) === String(inq.property_id))
        ).length || 0;

        const myUnpaidDuesCount = processedMyRentings.filter(r => r.calculatedStatus === 'Pending').length;

        const pendingInquiriesSent = allInquiries?.filter(inq =>
            String(inq.tenant_id) === String(userId) &&
            inq.status === 'pending'
        ).length || 0;

        const rawUsername = currentUser?.username || "Guest";
        const truncatedUserName = rawUsername.length > 50
            ? rawUsername.substring(0, 50) + "..."
            : rawUsername;

        return {
            userName: truncatedUserName,
            fullUserName: rawUsername,
            balance: currentUser?.balance ? parseFloat(currentUser.balance) : 0,
            totalProperties: myOwnedProperties.length,
            totalTenants: totalTenantsCount,
            pendingInquiriesReceived: pendingInquiriesReceived,
            totalRentings: allRentings.length,
            unpaidDues: myUnpaidDuesCount,
            pendingInquiriesSent: pendingInquiriesSent,
        };
    }, [myOwnedProperties, allInquiries, allRentings, processedLandlordTenants, processedMyRentings, currentUser, userId]);

    return (
        <div className="home-dashboard-container">
            <section className="dashboard-welcome-banner">
                <div className="banner-content">
                    <h1 className="banner-title" title={stats.fullUserName}>
                        Welcome back, {stats.userName}!
                    </h1>
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