import React, { useState, useEffect } from "react";
import api from "../api/api";

function Cards() {
    const [cards, setCards] = useState([]);
    const [form, setForm] = useState({ customer_id:"", card:"", exp:"", cvv:"" });

    const fetchCards = async () => {
        const res = await api.get("/card/list"); // create endpoint
        setCards(res.data.cards);
    };

    const addCard = async () => {
        await api.post("/card/store", form);
        fetchCards();
        setForm({ customer_id:"", card:"", exp:"", cvv:"" });
    };

    useEffect(() => { fetchCards() }, []);

    return (
        <div>
            <h3>Cards</h3>
            <input placeholder="Customer ID" value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})} />
            <input placeholder="Card Number" value={form.card} onChange={e=>setForm({...form,card:e.target.value})} />
            <input placeholder="Expiry" value={form.exp} onChange={e=>setForm({...form,exp:e.target.value})} />
            <input placeholder="CVV" value={form.cvv} onChange={e=>setForm({...form,cvv:e.target.value})} />
            <button onClick={addCard}>Add</button>
            <table border="1">
                <thead>
                    <tr><th>Card ID</th><th>Customer ID</th><th>Card</th><th>Expiry</th></tr>
                </thead>
                <tbody>
                    {cards.map(c => <tr key={c.card_id}><td>{c.card_id}</td><td>{c.customer_id}</td><td>{c.card_number}</td><td>{c.expiry_date}</td></tr>)}
                </tbody>
            </table>
        </div>
    );
}

export default Cards;
