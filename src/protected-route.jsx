import { Navigate } from "react-router-dom";

function protectedRoute({ children }) {
    const isAuth = localStorage.getItem("isLoggedIn") === "true";
    return isAuth ? children : <Navigate to="/" />;
}

export default protectedRoute;