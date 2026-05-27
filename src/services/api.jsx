import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost/api-CS-Elective/main.php?request=',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

export const authService = {
    login: (credentials) => api.post(`auth/login`, credentials),
    register: (data) => api.post(`auth/register`, data),
    logout: () => api.post(`auth/logout`),
    checkStatus: () => api.get(`auth/check`),
};

export const userService = {
    getProfile: (userId = null) => {
        return userId
            ? api.get(`users/profile`, { params: { user_id: userId } })
            : api.get(`users/profile`);
    },
    updateProfile: (data) => api.put(`users/profile`, data),
};

export const propertyService = {
    getAll: () => api.get(`properties`),
    getById: (id) => api.get(`properties/${id}`),
    getByOwnerId: (ownerId) => api.get(`properties`, { params: { owner_id: ownerId } }),
    getOwnerContextProperties: () => api.get(`properties/owner`),
    getAllTransactions: () => api.get(`properties/transactions`),
    getFilteredTransactions: (userId, unitOccupancy) =>
        api.get(`properties/filter-transactions`, {
            params: {
                user_id: userId,
                unit: unitOccupancy
            }
        }),
    addProperty: (data) => api.post(`properties`, data),
    updateProperty: (id, data) => api.put(`properties/${id}`, data),
    deleteProperty: (id) => api.delete(`properties/${id}`),
    updateStatus: (id, status) =>
        api.put(`properties/${id}`, {
            status_only: true,
            status: status
        }),

};

export const leaseService = {
    addLease: (data) => api.post(`leases`, data),
    getLeaseById: (id) => api.get(`leases/${id}`),
    getUserLeases: () => api.get(`leases`),
};

export const tenantService = {
    addTenant: (data) => api.post(`tenants`, data),
    getByPropertyId: (propertyId) => api.get(`tenants`, { params: { property_id: propertyId } }),
    removeTenant: (id) => api.delete(`admin/tenants/${id}`),
};
export const paymentService = {
    process: (data) => api.post(`payments`, data),
    getHistory: (tenantId) => api.get(`payments/tenant/${tenantId}`),
};

export const adminService = {
    getProperties: () => api.get(`admin/properties`),
    getTenants: () => api.get(`admin/tenants`),
};

export const reportService = {
    getRentPaymentsReport: () => api.get(`reports/rent-payments`),
    getOccupancyReport: () => api.get(`reports/occupancy`),
};

export const inquiryService = {
    getAll: () => api.get(`inquiries`),
    create: (data) => api.post(`inquiries`, data),
    accept: (data) => api.post(`inquiries/accept`, data),
    decline: (inquiryId) => api.post(`inquiries/decline`, { inquiry_id: inquiryId }),
};
