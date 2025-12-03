import React, { useState, useEffect } from "react";
import api from "../api/api";

function CardVault({ user }) {
  const [currentUser, setCurrentUser] = useState(user || JSON.parse(localStorage.getItem("userData")));
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // Helper to get the ID regardless of what the backend calls it
  const getUserId = (u) => u?.customer_id || u?.user_id;

  useEffect(() => {
    const activeUser = user || JSON.parse(localStorage.getItem("userData"));
    setCurrentUser(activeUser);

    const id = getUserId(activeUser);

    if (id) {
      fetchCards(id);
    } else {
      console.warn("No valid ID found in user object:", activeUser);
    }
  }, [user]);

  const fetchCards = async (customerId) => {
    if (!customerId) return;
    try {
      const res = await api.get(`/card/${customerId}`, { withCredentials: true });
      setCards(res.data.cards || []);
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.cardholderName.trim()) return setError("Cardholder name required");
    if (!/^\d{13,19}$/.test(formData.cardNumber.replace(/\s/g, ""))) return setError("Invalid card number");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) return setError("Invalid expiry date");
    if (!/^\d{3,4}$/.test(formData.cvv)) return setError("Invalid CVV");

    const id = getUserId(currentUser);

    if (!id) {
        return setError("No logged-in user ID found. Please re-login.");
    }

    setLoading(true);
    try {
      // We send the ID as 'customer_id' to the backend, because that's likely what the API expects in the body
      await api.post("/card/store", {
        customer_id: id, 
        card: formData.cardNumber.replace(/\s/g, ""),
        exp: formData.expiryDate,
        cvv: formData.cvv,
      }, { withCredentials: true });

      setSuccess("Card stored successfully!");
      setFormData({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
      setShowForm(false);
      fetchCards(id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to store card");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "cardNumber") {
      const cleaned = value.replace(/\D/g, "").slice(0, 19);
      setFormData({ ...formData, [name]: cleaned.replace(/(\d{4})(?=\d)/g, "$1 ") });
    } else if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "").slice(0, 4);
      const formatted = cleaned.length > 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
      setFormData({ ...formData, [name]: formatted });
    } else if (name === "cvv") {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "").slice(0, 4) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const maskCardNumber = (cardNum) => cardNum ? `**** **** **** ${cardNum.slice(-4)}` : "";

  return (
    <div className="app-container">
      <main role="main">
        <h2>Card Vault</h2>
        {error && <div style={{ borderLeft: "4px solid red", marginBottom: 12, padding: 10, background: "#fff0f0" }}>{error}</div>}
        {success && <div style={{ borderLeft: "4px solid green", marginBottom: 12, padding: 10, background: "#f0fff0" }}>{success}</div>}

        {!showForm && (
          <button className="btn" onClick={() => setShowForm(true)}>+ Store New Card</button>
        )}

        {showForm && (
          <section className="surface" style={{ marginTop: 16 }}>
            {/* Note: username/firstname might be missing in your current login response, so we add a fallback */}
            <h3>Store Card for {currentUser?.firstname || currentUser?.username || "Customer"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Cardholder Name</label>
                <input name="cardholderName" value={formData.cardholderName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="form-row">
                <label>Card Number</label>
                <input name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" maxLength="23" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>Expiry Date</label>
                  <input name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} placeholder="MM/YY" maxLength="5" />
                </div>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input name="cvv" type="password" value={formData.cvv} onChange={handleInputChange} placeholder="123" maxLength="4" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="submit" disabled={loading}>{loading ? "Storing…" : "Store Card"}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="surface" style={{ marginTop: 24 }}>
          <h3>Stored Cards</h3>
          {cards.length === 0 ? (
            <p>No cards stored yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Card ID</th>
                  <th>Card Number</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.card_id}>
                    <td>{card.card_id}</td>
                    <td>{maskCardNumber(card.card_number)}</td>
                    <td>{card.expiry_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default CardVault;