import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Customers from "./Customers";
import Cards from "./Cards";
import CardVault from "./CardVault";
import "./Dashboard.css";

function Dashboard({ user, role, onLogout }) {
  const [currentUser, setCurrentUser] = useState(user || JSON.parse(localStorage.getItem("userData")));
  const [currentRole, setCurrentRole] = useState((role || localStorage.getItem("userRole") || "").toLowerCase());
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Keep role in sync if prop changes
    const storedRole = role || localStorage.getItem("userRole");
    setCurrentRole(storedRole?.toLowerCase() || "");

    // Keep user in sync if prop changes
    const storedUser = user || JSON.parse(localStorage.getItem("userData"));
    setCurrentUser(storedUser);

    if (storedRole?.toLowerCase() === "admin") fetchAdminData();
  }, [role, user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/all_data", { credentials: "include" });
      const result = await response.json();
      setAdminData(result.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userRole");
    if (onLogout) onLogout();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="header-right">
            <span>Welcome, <strong>{currentUser?.username || "Guest"}</strong></span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <h3>Menu</h3>
          <ul>
            {(currentRole === "merchant" || currentRole === "admin") && (
              <>
                <li><Link to="customers">👥 Customers</Link></li>
                <li><Link to="vault">➕ Add New Card</Link></li>
              </>
            )}
            {currentRole === "customer" && (
              <>
                <li><Link to="cards">💳 My Cards</Link></li>
                <li><Link to="vault">➕ Add New Card</Link></li>
              </>
            )}
          </ul>
        </nav>

        <div className="dashboard-content">
          {currentRole === "admin" && (
            <div className="admin-section">
              <h2>System Overview</h2>
              {loading ? <p>Loading...</p> :
                adminData?.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Merchant</th>
                        <th>Email</th>
                        <th>Customer Name</th>
                        <th>Customer Email</th>
                        <th>Card Number</th>
                        <th>Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.business_name}</td>
                          <td>{item.contact_email}</td>
                          <td>{item.firstname ? `${item.firstname} ${item.lastname}` : "—"}</td>
                          <td>{item.email || "—"}</td>
                          <td>{item.card_number || "—"}</td>
                          <td>{item.expiry_date || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p>No data available</p>
              }
            </div>
          )}

          <Routes>
            <Route path="customers" element={<Customers />} />
            <Route path="cards" element={<Cards />} />
            <Route path="vault" element={<CardVault user={currentUser} />} />
            <Route path="/" element={<p>Welcome to your dashboard!</p>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
