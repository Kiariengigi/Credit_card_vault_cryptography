import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Customers from "./Customers";
import Merchants from "./Merchants";
import Cards from "./Cards";

function Dashboard({ user }) {
    return (
        <div>
            <h2>Welcome, {user.username}</h2>
            <nav>
                <Link to="customers">Customers</Link> | 
                <Link to="merchants">Merchants</Link> | 
                <Link to="cards">Cards</Link>
            </nav>
            <Routes>
                <Route path="customers" element={<Customers />} />
                <Route path="merchants" element={<Merchants />} />
                <Route path="cards" element={<Cards />} />
            </Routes>
        </div>
    );
}

export default Dashboard;
