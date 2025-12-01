import React, { useState } from "react";
import api from "../api/api";

function Register({ onLoginSuccess, setAuthView }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async () => {
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/register", { username, email, password });
            // On successful registration, automatically log the user in
            try {
                const login = await api.post('/login', { username, password });
                // confirm session
                await api.get('/session/check');
                if (onLoginSuccess) onLoginSuccess(login.data);
            } catch (loginErr) {
                // registration succeeded but auto-login failed
                console.error('Auto-login failed', loginErr);
                setError('Registered but auto-login failed. Please sign in.');
            }
        } catch (err) {
            console.error('Register error', err);
            setError(err.response?.data?.error || 'Register failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ maxWidth: 420, paddingTop: 48 }}>
            <main className="surface" role="main" aria-labelledby="register-heading">
                <h2 id="register-heading">Create account</h2>
                {error && <div role="alert" style={{ color: "#ffb4b4", marginBottom: 8 }}>{error}</div>}

                <div className="form-row">
                    <label htmlFor="reg-username">Username</label>
                    <input id="reg-username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="form-row">
                    <label htmlFor="reg-email">Email</label>
                    <input id="reg-email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-row">
                    <label htmlFor="reg-password">Password</label>
                    <input id="reg-password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={handleRegister} disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
                    <button type="button" className="btn secondary" onClick={() => { setUsername(''); setEmail(''); setPassword(''); }}>{'Clear'}</button>
                </div>
                <div style={{ marginTop: 12 }}>
                    <span>Already have an account? </span>
                    <button type="button" className="btn link" onClick={() => setAuthView && setAuthView('login')}>Sign in</button>
                </div>
            </main>
        </div>
    );
}

export default Register;
