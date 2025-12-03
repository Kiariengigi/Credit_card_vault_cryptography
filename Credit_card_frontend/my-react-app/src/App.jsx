import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  // On load, check if user is stored in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    const storedRole = localStorage.getItem("userRole");
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedRole) setRole(storedRole);
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userRole", userData.role);
    setUser(userData);
    setRole(userData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userRole");
    setUser(null);
    setRole("");
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/dashboard/*" element={<Dashboard user={user} role={role} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;
