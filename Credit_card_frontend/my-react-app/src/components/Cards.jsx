import React, { useState, useEffect } from "react";
import api from "../api/api";

function Cards() {
    const [cards, setCards] = useState([]);

    const fetchCards = async () => {
        const res = await api.get("/customer/my_cards"); // Fetch only the logged-in customer's cards
        setCards(res.data.cards);
    };

    useEffect(() => { fetchCards() }, []);

    return (
        <div>
            <h3>My Cards</h3>
            <table border="1">
                <thead>
                    <tr><th>Card ID</th><th>Card</th><th>Expiry</th></tr>
                </thead>
                <tbody>
                    {cards.map(c => <tr key={c.card_id}><td>{c.card_id}</td><td>{c.card_number}</td><td>{c.expiry_date}</td></tr>)}
                </tbody>
            </table>
        </div>
    );
}

export default Cards;
