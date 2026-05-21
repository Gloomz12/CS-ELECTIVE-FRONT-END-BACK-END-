const API_BASE_URL = "http://localhost/API";

export const removeTenant = async (tenantId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tenants/deleteTenant.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ tenant_id: tenantId })
        });

        const text = await response.text();
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error("Server returned non-JSON response:", text);
            return { success: false, message: "Invalid server response format." };
        }
    } catch (error) {
        console.error("Network Error:", error);
        return { success: false, message: "Server connection failed." };
    }
};

export const deleteProperty = async (propertyId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/properties/deleteProperty.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ property_id: propertyId })
        });
        const text = await response.text();
        return JSON.parse(text);
    } catch (error) {
        return { success: false, message: "Server connection failed." };
    }
};