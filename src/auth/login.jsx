import React, { useState } from "react";
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