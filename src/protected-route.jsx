import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const isAuth = localStorage.getItem("isLoggedIn") === "true";
    return isAuth ? children : <Navigate to="/" />;
}

export default ProtectedRoute;