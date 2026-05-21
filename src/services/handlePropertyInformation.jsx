import axios from 'axios';

const API_URL = 'http://localhost/api/properties/handlePropertyInformation.php';

export const addPropertyToDB = async (propertyData) => {
    try {
        const payload = {
            action: 'add',
            owner_id: propertyData.ownerId,
            name: propertyData.name,
            type: propertyData.type === 'boarding house' ? 'apartment' : propertyData.type,
            price_monthly: propertyData.price,
            location_address: propertyData.location,
            image_url: propertyData.image_url,
            map_image_url: propertyData.locationImg,
            amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities.join(', ') : propertyData.amenities
        };

        const response = await axios.post(API_URL, payload);
        return response.data;
    } catch (error) {
        console.error("Axios Error adding property:", error.response?.data || error.message);
        throw error;
    }
};

export const updatePropertyInDB = async (propertyData) => {
    try {
        const payload = {
            action: 'edit',
            id: propertyData.id,
            name: propertyData.name,
            type: propertyData.type === 'boarding house' ? 'apartment' : propertyData.type,
            price_monthly: propertyData.price || propertyData.price_monthly,
            location_address: propertyData.location || propertyData.location_address,
            image_url: propertyData.image_url,
            map_image_url: propertyData.locationImg || propertyData.map_image_url,
            amenities: Array.isArray(propertyData.amenities) ? propertyData.amenities.join(', ') : propertyData.amenities
        };

        const response = await axios.post(API_URL, payload);
        return response.data;
    } catch (error) {
        console.error("Axios Error updating property:", error.response?.data || error.message);
        throw error;
    }
};