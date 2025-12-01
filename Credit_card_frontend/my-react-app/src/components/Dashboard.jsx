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
                {user.role === "merchant" && <Link to="customers">Customers</Link>} {/* Merchants see customers */}
                {user.role === "merchant" && " | "}
                <Link to="cards">Cards</Link> {/* Both roles see cards */}
            </nav>
            <Routes>
                {user.role === "merchant" && <Route path="customers" element={<Customers />} />} {/* Merchants see customers */}
                <Route path="cards" element={<Cards />} /> {/* Both roles see cards */}
            </Routes>
        </div>
    );
}

export default Dashboard;
