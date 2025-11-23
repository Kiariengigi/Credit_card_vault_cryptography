import React, { useState, useEffect } from "react";
import api from "../api/api";

function Merchants() {
    const [merchants, setMerchants] = useState([]);
    const [form, setForm] = useState({ name: "", email: "" });

    const fetchMerchants = async () => {
        const res = await api.get("/merchant/list"); // create endpoint
        setMerchants(res.data.merchants);
    };

    const addMerchant = async () => {
        await api.post("/merchant/create", form);
        fetchMerchants();
        setForm({ name: "", email: "" });
    };

    useEffect(() => { fetchMerchants() }, []);

    return (
        <div>
            <h3>Merchants</h3>
            <input placeholder="Business Name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} />
            <button onClick={addMerchant}>Add</button>
            <ul>{merchants.map(m => <li key={m.merchant_id}>{m.business_name} - {m.contact_email}</li>)}</ul>
        </div>
    );
}

export default Merchants;
