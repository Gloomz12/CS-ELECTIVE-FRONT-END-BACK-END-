import React from "react";

export const changePropertyState = async (propertyId, status) => {
    try {
        const API_URL = 'http://localhost/api/properties/updatePropertyStatus.php';

        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                id: propertyId, 
                status: status 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server responded with ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Service Error:", error);
        throw error;
    }
};