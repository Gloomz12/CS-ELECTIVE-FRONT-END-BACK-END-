import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => setShowPassword(!showPassword);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post("http://localhost/api/auth/login.php", {
                email: email,
                password: password
            });

            if (response.data.success) {
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userId", response.data.user_id);
                localStorage.setItem("username", response.data.username);
                navigate("/home");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Invalid credentials");
        }
    };

    useEffect(() => {
        const verifyBackend = async () => {
            // Change the URL to match the specific file you are testing
            const testUrl = "http://localhost/api/auth/login.php?test_connection=true";

            console.log("%c--- System Connection Audit ---", "color: #2196F3; font-weight: bold;");

            try {
                const response = await axios.get(testUrl);

                if (response.data.success) {
                    console.log("%c✔ Backend Reachable", "color: #4CAF50;");
                    console.log("Database Status:", response.data.database);
                    console.log("Server Timestamp:", response.data.server_time);
                }
            } catch (err) {
                console.error("%c✘ Connection Failed", "color: #F44336; font-weight: bold;");

                if (err.response) {
                    console.table({
                        Status: err.response.status,
                        Data: err.response.data,
                        Source: "PHP Error"
                    });
                } else {
                    console.error("XAMPP/Apache might be offline or URL is incorrect.");
                }
            }
            console.log("%c-------------------------------", "color: #2196F3;");
        };

        verifyBackend();
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome to <br /> Dorm Dash</h1>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <img src="/images/mail.png" alt="email" className="input-icon-img" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="auth-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <img
                                src={showPassword ? "/images/hide.png" : "/images/view.png"}
                                alt="toggle visibility"
                                className="input-icon-img password-toggle"
                                onClick={togglePassword}
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-button">Log in</button>
                </form>

                <p className="footer-text">
                    Don't have an account? <a href="/register" className="auth-link">Sign up</a>
                </p>
            </div>
        </div>
    );
}

export default Login;