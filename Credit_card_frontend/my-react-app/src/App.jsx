import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import CardVault from "./components/CardVault";

function App() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_URL = "https://credit-card-vault-cryptography.onrender.com"

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const customerRes = await fetch(`${API_URL}/customer/list`, { credentials: "include" });
      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomers(data.customers || []);
      } else if (customerRes.status === 401) {
        setIsLoggedIn(false);
        return;
      }

      const merchantRes = await fetch(`${API_URL}/merchant/list`, { credentials: "include" });
      if (merchantRes.ok) {
        const data = await merchantRes.json();
        setMerchants(data.merchants || []);
      } else if (merchantRes.status === 401) {
        setIsLoggedIn(false);
        return;
      }

      const cardRes = await fetch(`${API_URL}/card/list`, { credentials: "include" });
      if (cardRes.ok) {
        const data = await cardRes.json();
        setCards(data.cards || []);
      } else if (cardRes.status === 401) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if logged in
    if (isLoggedIn) {
      console.log("User is logged in, fetching data...");
      fetchData();
    } else {
      console.log("User is not logged in, skipping data fetch");
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { 
        method: "POST",
        credentials: "include" 
      });
      setIsLoggedIn(false);
      setCustomers([]);
      setMerchants([]);
      setCards([]);
      setCurrentView("dashboard");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!isLoggedIn && loading) {
    return (
      <div className="app-container" style={{ paddingTop: 20 }}>
        <h2>Loading…</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (error) {
    return (
      <div className="app-container" style={{ paddingTop: 20 }}>
        <h2 role="alert" style={{ color: "#ff6b6b" }}>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="app-container" role="application">
      <header id="app-header" role="banner">
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <h2>Credit Card Vault</h2>
        </div>

        <nav aria-label="Primary" className="nav-actions">
          <button
            className="btn"
            aria-pressed={currentView === "dashboard"}
            aria-current={currentView === "dashboard" ? "page" : undefined}
            onClick={() => setCurrentView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className="btn"
            aria-pressed={currentView === "cardvault"}
            aria-current={currentView === "cardvault" ? "page" : undefined}
            onClick={() => setCurrentView("cardvault")}
          >
            Card Vault
          </button>
          <button className="btn danger" onClick={handleLogout} aria-label="Log out">Logout</button>
        </nav>
      </header>

      <main className="main">
        {currentView === "dashboard" ? (
          <>
            <div className="content">
              <h1>Dashboard</h1>

              <section className="surface-section surface">
                <h2>Customers</h2>
                {customers.length === 0 ? (
                  <p>No customers found</p>
                ) : (
                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((c) => (
                          <tr key={c.customer_id}>
                            <td>{c.customer_id}</td>
                            <td>{c.firstname} {c.lastname}</td>
                            <td>{c.email}</td>
                            <td>{c.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="surface-section surface">
                <h2>Merchants</h2>
                {merchants.length === 0 ? (
                  <p>No merchants found</p>
                ) : (
                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Business Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchants.map((m) => (
                          <tr key={m.merchant_id}>
                            <td>{m.merchant_id}</td>
                            <td>{m.business_name}</td>
                            <td>{m.contact_email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="surface-section surface">
                <h2>Recent Cards (Last 10)</h2>
                {cards.length === 0 ? (
                  <p>No cards stored yet</p>
                ) : (
                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Card ID</th>
                          <th>Customer ID</th>
                          <th>Card Number</th>
                          <th>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.slice(0, 10).map((card) => (
                          <tr key={card.card_id}>
                            <td>{card.card_id}</td>
                            <td>{card.customer_id}</td>
                            <td style={{ fontFamily: "monospace" }}>**** **** **** {card.card_number?.slice(-4)}</td>
                            <td>{card.expiry_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="aside">
            <CardVault />
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
