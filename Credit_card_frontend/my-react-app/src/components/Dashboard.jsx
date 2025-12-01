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
                {user.role === "customer" && <Link to="cards">Cards</Link>} {/* Customers see cards */}
            </nav>
            <Routes>
                {user.role === "merchant" && <Route path="customers" element={<Customers />} />} {/* Merchants see customers */}
                {user.role === "customer" && <Route path="cards" element={<Cards />} />} {/* Customers see cards */}
            </Routes>
        </div>
    );
}

export default Dashboard;
