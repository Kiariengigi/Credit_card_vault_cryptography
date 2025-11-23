import React, { useState, useEffect } from "react";
import api from "../api/api";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState({ firstname: "", lastname: "", email: "", phone: "", merchant_id: "" });

    const fetchCustomers = async () => {
        const res = await api.get("/customer/list"); // create this endpoint in Flask
        setCustomers(res.data.customers);
    };

    const addCustomer = async () => {
        await api.post("/customer", form);
        fetchCustomers();
        setForm({ firstname: "", lastname: "", email: "", phone: "", merchant_id: "" });
    };

    useEffect(() => { fetchCustomers() }, []);

    return (
        <div>
            <h3>Customers</h3>
            <div>
                <input placeholder="First Name" value={form.firstname} onChange={e => setForm({...form, firstname:e.target.value})} />
                <input placeholder="Last Name" value={form.lastname} onChange={e => setForm({...form, lastname:e.target.value})} />
                <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
                <input placeholder="Merchant ID" value={form.merchant_id} onChange={e => setForm({...form, merchant_id:e.target.value})} />
                <button onClick={addCustomer}>Add</button>
            </div>
            <table border="1">
                <thead>
                    <tr><th>ID</th><th>First</th><th>Last</th><th>Email</th><th>Phone</th></tr>
                </thead>
                <tbody>
                    {customers.map(c => <tr key={c.customer_id}><td>{c.customer_id}</td><td>{c.firstname}</td><td>{c.lastname}</td><td>{c.email}</td><td>{c.phone}</td></tr>)}
                </tbody>
            </table>
        </div>
    );
}

export default Customers;
