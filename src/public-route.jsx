import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { api } from "./services/api";

function PublicRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        api.get('auth/check')
            .then(res => setIsAuthenticated(res.data.logged_in))
            .catch(() => setIsAuthenticated(false));
    }, []);

    if (isAuthenticated === null) return <div>Loading...</div>;

    return isAuthenticated ? <Navigate to="/main/home" replace /> : children;
}

export default PublicRoute;