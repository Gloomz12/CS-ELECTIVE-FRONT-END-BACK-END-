import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
            console.log("Submitting registration with:", { username, email, password });
            const response = await axios.post("http://localhost/api/auth/register.php", {
                username: username,
                email: email,
                password: password
            });

            if (response.data.success) {
                alert("Registration successful!");
            } else {
                setErrorMessage(response.data.message || "The email or username is already registered. Please try again.");
            }
        } catch (err) {
            console.error("Registration error:", err.response?.data?.message || "Registration failed");
            setErrorMessage(err.response?.data?.message || "A network error occurred. Please try again.");
        }
    };

    useEffect(() => {
        const checkConnection = async () => {
            try {
                console.log("--- Connection Test Started ---");

                const response = await axios.get("http://localhost/api/auth/register.php?test_connection=true");

                console.log("Backend Status:", response.data.status);
                console.log("Server Message:", response.data.message);
                console.log("Full PHP Response:", response.data);
                console.log("--- Connection Successful ---");
            } catch (err) {
                console.error("--- Connection Failed ---");
                if (err.response) {
                    console.error("PHP Error Code:", err.response.status);
                    console.error("PHP Error Detail:", err.response.data);
                } else if (err.request) {
                    console.error("No response from PHP. Is Apache running in XAMPP?");
                } else {
                    console.error("Axios setup error:", err.message);
                }
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