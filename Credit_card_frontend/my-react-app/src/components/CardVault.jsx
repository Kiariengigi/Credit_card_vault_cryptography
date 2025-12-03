import React, { useState, useEffect } from "react";
import api from "../api/api";

function CardVault() {
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

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
  const storedUser = localStorage.getItem("userData");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    fetchCards(user.customer_id); // fetch cards for this user
  }
}, []);


const fetchCards = async (customerId) => {
  try {
    if (!customerId) return;
    const res = await api.get(`/card/list/${customerId}`, { withCredentials: true });
    setCards(res.data.cards || []);
  } catch (err) {
    console.error("Failed to fetch cards:", err);
  }
};



  const validateCardNumber = (num) => /^\d{13,19}$/.test(num.replace(/\s/g, ""));
  const validateExpiry = (exp) => {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(exp)) return false;
    const [month, year] = exp.split("/");
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expYear = parseInt(year);
    if (expYear < currentYear) return false;
    if (expYear === currentYear && parseInt(month) < currentMonth) return false;
    return true;
  };
  const validateCVV = (cvv) => /^\d{3,4}$/.test(cvv);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.cardholderName.trim()) {
      setError("Cardholder name is required");
      return;
    }
    if (!validateCardNumber(formData.cardNumber)) {
      setError("Invalid card number (13-19 digits)");
      return;
    }
    if (!validateExpiry(formData.expiryDate)) {
      setError("Invalid expiry date (MM/YY) or card expired");
      return;
    }
    if (!validateCVV(formData.cvv)) {
      setError("Invalid CVV (3-4 digits)");
      return;
    }
    if (!currentUser) {
      setError("No logged-in user found");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/card/store",
        {
          customer_id: currentUser.customer_id, // use logged-in customer
          card: formData.cardNumber.replace(/\s/g, ""),
          exp: formData.expiryDate,
          cvv: formData.cvv,
        },
        { withCredentials: true }
      );

      setSuccess("Card stored successfully!");
      setFormData({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
      setShowForm(false);
      fetchCards();
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
      const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
      setFormData({ ...formData, [name]: formatted });
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

  const maskCardNumber = (cardNum) => {
    if (!cardNum) return "";
    const last4 = cardNum.slice(-4);
    return `**** **** **** ${last4}`;
  };

  return (
    <div className="app-container">
      <main role="main">
        <h2>Card Vault</h2>

        {error && <div className="surface" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 12 }}>{error}</div>}
        {success && <div className="surface" style={{ borderLeft: '4px solid var(--accent)', marginBottom: 12 }}>{success}</div>}

        {!showForm ? (
          <button className="btn" onClick={() => setShowForm(true)}>+ Store New Card</button>
        ) : (
          <section className="surface" style={{ marginTop: 16 }}>
            <h3>Store Card for {currentUser?.firstname} {currentUser?.lastname}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>Cardholder Name</label>
                <input name="cardholderName" type="text" value={formData.cardholderName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="form-row">
                <label>Card Number</label>
                <input name="cardNumber" type="text" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" maxLength="23" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>Expiry Date</label>
                  <input name="expiryDate" type="text" value={formData.expiryDate} onChange={handleInputChange} placeholder="MM/YY" maxLength="5" />
                </div>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input name="cvv" type="password" value={formData.cvv} onChange={handleInputChange} placeholder="123" maxLength="4" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" type="submit" disabled={loading}>{loading ? 'Storing…' : 'Store Card'}</button>
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="surface" style={{ marginTop: 24 }}>
          <h3>Stored Cards</h3>
          {cards.length === 0 ? <p>No cards stored yet</p> : (
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
