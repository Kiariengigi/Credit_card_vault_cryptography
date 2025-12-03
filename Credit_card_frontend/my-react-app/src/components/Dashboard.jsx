import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Customers from "./Customers";
import Cards from "./Cards";
import CardVault from "./CardVault";
import "./Dashboard.css";

function Dashboard({ user, role, onLogout }) {
  const [currentRole, setCurrentRole] = useState(role || localStorage.getItem("userRole"));
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setCurrentRole(storedRole);
    if (storedRole === "Admin" || storedRole === "admin") fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/all_data", { credentials: "include" });
      const result = await response.json();
      setAdminData(result.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
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
            <span className="user-info">Welcome, <strong>{user?.username}</strong></span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <h3>Menu</h3>
          <ul>
            {(currentRole === "Merchant" || currentRole === "merchant") && (
              <>
                <li><Link to="customers" className="nav-link">👥 Customers</Link></li>
                <li><Link to="vault" className="nav-link">➕ Add New Card</Link></li>
              </>
            )}
            {(currentRole === "Customer" || currentRole === "customer") && (
              <>
                <li><Link to="cards" className="nav-link">💳 My Cards</Link></li>
                <li><Link to="vault" className="nav-link">➕ Add New Card</Link></li>
              </>
            )}
          </ul>
        </nav>

        <div className="dashboard-content">
          {(currentRole === "Admin" || currentRole === "admin") && (
            <div className="admin-section">
              <h2>System Overview</h2>
              {loading ? <p>Loading data...</p> :
                adminData && adminData.length > 0 ? (
                  <div className="table-wrapper">
                    <table className="data-table">
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
                          <tr key={idx} className={idx % 2 === 0 ? "even" : "odd"}>
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
                  </div>
                ) : <p>No data available</p>
              }
            </div>
          )}

          <Routes>
            <Route path="customers" element={<Customers />} />
            <Route path="cards" element={<Cards />} />
            <Route path="vault" element={<CardVault />} />
            <Route path="/" element={<p>Welcome to your dashboard!</p>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
