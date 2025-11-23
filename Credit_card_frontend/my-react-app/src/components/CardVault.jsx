import React, { useState, useEffect } from "react";
import api from "../api/api";

function CardVault() {
  const [customers, setCustomers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ merchant_id: "", firstname: "", lastname: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchCards();
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await api.get("/merchant/list", { withCredentials: true });
      setMerchants(res.data.merchants || []);
    } catch (err) {
      console.error("Failed to fetch merchants:", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customer/list", { withCredentials: true });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await api.get("/card/list", { withCredentials: true });
      setCards(res.data.cards || []);
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    }
  };

  const validateCardNumber = (num) => {
    return /^\d{13,19}$/.test(num.replace(/\s/g, ""));
  };

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

  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!selectedCustomer && !isNewCustomer) {
      setError("Please select a customer or create a new one");
      return;
    }

    if (isNewCustomer) {
      // validate new customer fields
      if (!newCustomerData.merchant_id) { setError("Please select a merchant for the new customer"); return; }
      if (!newCustomerData.firstname.trim() || !newCustomerData.lastname.trim()) { setError("Customer name required"); return; }
      if (!newCustomerData.email.trim()) { setError("Customer email required"); return; }
      if (!newCustomerData.phone.trim()) { setError("Customer phone required"); return; }
    }
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

    setLoading(true);
    try {
      if (isNewCustomer) {
        // create customer and store card in one request
        const payload = {
          merchant_id: newCustomerData.merchant_id,
          firstname: newCustomerData.firstname,
          lastname: newCustomerData.lastname,
          email: newCustomerData.email,
          phone: newCustomerData.phone,
          card: formData.cardNumber.replace(/\s/g, ""),
          exp: formData.expiryDate,
          cvv: formData.cvv,
        };
        await api.post("/customer/store_with_card", payload, { withCredentials: true });
      } else {
        await api.post(
          "/card/store",
          {
            customer_id: selectedCustomer,
            card: formData.cardNumber.replace(/\s/g, ""),
            exp: formData.expiryDate,
            cvv: formData.cvv,
          },
          { withCredentials: true }
        );
      }

      setSuccess("Card stored successfully!");
      setFormData({ cardholderName: "", cardNumber: "", expiryDate: "", cvv: "" });
      setSelectedCustomer("");
      setIsNewCustomer(false);
      setNewCustomerData({ merchant_id: "", firstname: "", lastname: "", email: "", phone: "" });
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
      // Format card number with spaces every 4 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 19);
      const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
      setFormData({ ...formData, [name]: formatted });
    } else if (name === "expiryDate") {
      // Format expiry as MM/YY
      const cleaned = value.replace(/\D/g, "").slice(0, 4);
      const formatted = cleaned.length > 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2)}` : cleaned;
      setFormData({ ...formData, [name]: formatted });
    } else if (name === "cvv") {
      // Only allow digits
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

        {error && <div role="alert" className="surface" style={{ borderLeft: '4px solid var(--danger)', marginBottom: 12 }}>{error}</div>}
        {success && <div role="status" className="surface" style={{ borderLeft: '4px solid var(--accent)', marginBottom: 12 }}>{success}</div>}

        {!showForm ? (
          <div style={{ marginBottom: 16 }}>
            <button className="btn" onClick={() => setShowForm(true)} aria-expanded={showForm}>+ Store New Card</button>
          </div>
        ) : (
          <section className="surface" aria-labelledby="store-card-heading" style={{ marginBottom: 16 }}>
            <h3 id="store-card-heading">Store Customer Card</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="select-customer">Select Customer</label>
                <select
                  id="select-customer"
                  value={selectedCustomer}
                  onChange={(e) => { setSelectedCustomer(e.target.value); setIsNewCustomer(e.target.value === 'new'); }}
                >
                  <option value="">-- Choose a Customer --</option>
                  <option value="new">+ Create New Customer</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.firstname} {c.lastname} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {isNewCustomer && (
                <fieldset className="surface" style={{ padding: 12 }}>
                  <legend>New Customer Details</legend>
                  <div className="form-row">
                    <label htmlFor="merchant-select">Merchant</label>
                    <select id="merchant-select" value={newCustomerData.merchant_id} onChange={(e) => setNewCustomerData({ ...newCustomerData, merchant_id: e.target.value })}>
                      <option value="">-- Select Merchant --</option>
                      {merchants.map(m => (
                        <option key={m.merchant_id} value={m.merchant_id}>{m.business_name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }} className="form-row">
                      <label htmlFor="new-first">First name</label>
                      <input id="new-first" value={newCustomerData.firstname} onChange={(e) => setNewCustomerData({ ...newCustomerData, firstname: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }} className="form-row">
                      <label htmlFor="new-last">Last name</label>
                      <input id="new-last" value={newCustomerData.lastname} onChange={(e) => setNewCustomerData({ ...newCustomerData, lastname: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }} className="form-row">
                      <label htmlFor="new-email">Email</label>
                      <input id="new-email" value={newCustomerData.email} onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }} className="form-row">
                      <label htmlFor="new-phone">Phone</label>
                      <input id="new-phone" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />
                    </div>
                  </div>
                </fieldset>
              )}

              <div className="form-row">
                <label htmlFor="cardholder">Cardholder Name</label>
                <input id="cardholder" name="cardholderName" type="text" value={formData.cardholderName} onChange={handleInputChange} placeholder="John Doe" />
              </div>

              <div className="form-row">
                <label htmlFor="cardnumber">Card Number</label>
                <input id="cardnumber" name="cardNumber" type="text" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" maxLength="23" />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }} className="form-row">
                  <label htmlFor="expiry">Expiry Date</label>
                  <input id="expiry" name="expiryDate" type="text" value={formData.expiryDate} onChange={handleInputChange} placeholder="MM/YY" maxLength="5" />
                </div>
                <div style={{ flex: 1 }} className="form-row">
                  <label htmlFor="cvv">CVV</label>
                  <input id="cvv" name="cvv" type="password" value={formData.cvv} onChange={handleInputChange} placeholder="123" maxLength="4" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" type="submit" disabled={loading}>{loading ? 'Storing…' : 'Store Card'}</button>
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="surface">
          <h3>Stored Cards</h3>
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
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.card_id}>
                      <td>{card.card_id}</td>
                      <td>{card.customer_id}</td>
                      <td style={{ fontFamily: 'monospace' }}>{maskCardNumber(card.card_number)}</td>
                      <td>{card.expiry_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CardVault;
