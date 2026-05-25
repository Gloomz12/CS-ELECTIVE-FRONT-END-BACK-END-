import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../services/api";

const API_URL = "http://localhost/api/main.php?request=";

function Register() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [validations, setValidations] = useState({
        upper: false,
        symbol: false,
        number: false,
        length: false
    });

    const togglePassword = () => setShowPassword(!showPassword);

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        setValidations({
            upper: /[A-Z]/.test(val),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(val),
            number: /[0-9]/.test(val),
            length: val.length >= 8
        });
    };

    const isFormValid = Object.values(validations).every(Boolean) && username && email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!isFormValid) return;

        try {
            const response = await authService.register({
                username,
                email,
                password
            });

            if (response.data.success) {
                alert("Registration successful!");
                navigate("/login");
            } else {
                setErrorMessage(response.data.message || "Registration failed.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setErrorMessage(err.response?.data?.message || "A network error occurred.");
        }
    };

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await axios.get(`${API_URL}auth/register`);
                console.log("Backend Router Status: Active");
            } catch (err) {
                console.error("Backend Router Unreachable: Is Apache running?");
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome to <br /> Dorm Dash</h1>

                <form onSubmit={handleSubmit}>
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
                                onChange={handlePasswordChange}
                                required
                            />
                            <img
                                src={showPassword ? "/images/hide.png" : "/images/view.png"}
                                alt="toggle visibility"
                                className="input-icon-img password-toggle"
                                onClick={togglePassword}
                            />
                        </div>

                        <div className="password-requirements" style={{ textAlign: 'left', fontSize: '12px', marginTop: '5px' }}>
                            <div style={{ color: validations.upper ? '#4caf50' : '#ff4d4d' }}>{validations.upper ? '✔' : '✖'} 1 uppercase letter</div>
                            <div style={{ color: validations.symbol ? '#4caf50' : '#ff4d4d' }}>{validations.symbol ? '✔' : '✖'} 1 symbol</div>
                            <div style={{ color: validations.number ? '#4caf50' : '#ff4d4d' }}>{validations.number ? '✔' : '✖'} 1 number</div>
                            <div style={{ color: validations.length ? '#4caf50' : '#ff4d4d' }}>{validations.length ? '✔' : '✖'} 8 characters minimum</div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                className="auth-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <img src="/images/card.png" alt="username" className="input-icon-img" />
                        </div>
                    </div>

                    {errorMessage && (
                        <div style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                            {errorMessage}
                        </div>
                    )}

                    <button type="submit" className="auth-button" disabled={!isFormValid}>Register now</button>
                </form>

                <p className="footer-text">
                    Already have an account? <a href="/login" className="auth-link">Log in</a>
                </p>
            </div>
        </div>
    );
}

export default Register;