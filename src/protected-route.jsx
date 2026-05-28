import { useState, useEffect } from "react";
import { api } from "./services/api";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('auth/check');
                setIsAuthenticated(response.data.logged_in);
            } catch (err) {
                setIsAuthenticated(false);
            }
        };
        checkSession();
    }, []);

    if (isAuthenticated === null) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}