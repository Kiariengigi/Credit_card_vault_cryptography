import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const res = await api.post("/login", { username, password });
        console.log("Login response:", res.data); // Check this log in console!

        // 1. Save full user data
        localStorage.setItem("userData", JSON.stringify(res.data));

        // 2. FIX: Explicitly save the role so Dashboard can find it
        // Note: Make sure your backend actually sends 'role' in res.data
        if (res.data.role) {
            localStorage.setItem("userRole", res.data.role);
        } else {
            console.warn("Warning: No 'role' field found in login response");
        }

        // Notify App of login
        if (onLoginSuccess) onLoginSuccess(res.data);

        navigate("/dashboard");
    } catch (err) {
        console.error("Login error:", err);
        setError(err.response?.data?.error || "Login failed");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="app-container" style={{ maxWidth: 420, paddingTop: 48 }}>
            <main className="surface" role="main">
                <h2>Sign in</h2>
                {error && <div style={{ color: "#ffb4b4", marginBottom: 8 }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-row">
                        <label>Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>

                    <div className="form-row">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
                        <button type="button" onClick={() => { setUsername(""); setPassword(""); }}>Clear</button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default Login;
