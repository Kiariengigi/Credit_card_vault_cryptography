import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Customers from "./Customers";
import Cards from "./Cards";
import "./Dashboard.css";

function Dashboard({ user, role, onLogout }) {
  const [currentRole, setCurrentRole] = useState(role);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    setCurrentRole(storedRole);
    console.log("ROLE INSIDE DASHBOARD:", storedRole);

    // Fetch admin data if user is admin
    if (storedRole === "Admin" || storedRole === "admin") {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/all_data", {
        credentials: "include",
      });
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
            <span className="user-info">
              Welcome, <strong>{user?.username}</strong>
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <h3>Menu</h3>
          <ul>
            {(currentRole === "Merchant" || currentRole === "merchant") && (
              <li>
                <Link to="customers" className="nav-link">
                  👥 Customers
                </Link>
              </li>
            )}

            {(currentRole === "Customer" || currentRole === "customer") && (
              <li>
                <Link to="cards" className="nav-link">
                  💳 My Cards
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="dashboard-content">
          {(currentRole === "Admin" || currentRole === "admin") && (
            <div className="admin-section">
              <h2>System Overview</h2>
              {loading ? (
                <div className="loading">
                  <p>Loading data...</p>
                </div>
              ) : adminData && adminData.length > 0 ? (
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
                      {adminData.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "even" : "odd"}>
                          <td>
                            <span className="badge merchant-badge">
                              {item.business_name}
                            </span>
                          </td>
                          <td>{item.contact_email}</td>
                          <td>
                            {item.firstname
                              ? `${item.firstname} ${item.lastname}`
                              : "—"}
                          </td>
                          <td>{item.email || "—"}</td>
                          <td>
                            <code className="card-number">
                              {item.card_number || "—"}
                            </code>
                          </td>
                          <td>
                            <span className="expiry-badge">
                              {item.expiry_date || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">
                  <p>No data available</p>
                </div>
              )}
            </div>
          )}

          <Routes>
            {(currentRole === "Merchant" || currentRole === "merchant") && (
              <Route path="customers" element={<Customers />} />
            )}

            {(currentRole === "Customer" || currentRole === "customer") && (
              <Route path="cards" element={<Cards />} />
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
