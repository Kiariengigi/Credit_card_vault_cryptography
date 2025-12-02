import React, { useState } from "react";
import api from "../api/api";

function Login({ onLoginSuccess, setAuthView }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e?.preventDefault?.();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/login", { username, password });
            console.log("Login response:", res.data);

            // Save user role in local storage
            localStorage.setItem("userRole", res.data.role);
            console.log(localStorage.getItem("userRole"))

            // Verify session was established
            const sessionCheck = await api.get("/session/check");
            console.log("Session check after login:", sessionCheck.data);

            if (onLoginSuccess) onLoginSuccess(res.data);
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: 420, paddingTop: 48 }}>
            <main className="surface" role="main" aria-labelledby="login-heading">
                <h2 id="login-heading">Sign in</h2>
                {error && <div role="alert" style={{ color: "#ffb4b4", marginBottom: 8 }}>{error}</div>}

                <form onSubmit={handleLogin} aria-label="Login form">
                    <div className="form-row">
                        <label htmlFor="username">Username</label>
                        <input id="username" name="username" aria-required="true" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" aria-required="true" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
                        <button type="button" className="btn secondary" onClick={() => { setUsername(''); setPassword(''); }}>{'Clear'}</button>
                    </div>
                </form>

                <div style={{ marginTop: 12 }}>
                    <span>Don't have an account? </span>
                    <button type="button" className="btn link" onClick={() => setAuthView && setAuthView('register')}>Create account</button>
                </div>
            </main>
        </div>
    );
}

export default Login;
