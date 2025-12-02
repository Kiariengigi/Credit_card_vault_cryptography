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
                {user.role === "Merchant" && <Link to="customers">Customers</Link>} {/* Merchants see customers */}
                {user.role === "Merchant" && " | "}
                {user.role === "Customer" && <Link to="cards">Cards</Link>} {/* Customers see cards */}
            </nav>
            <Routes>
                {user.role === "Merchant" && <Route path="customers" element={<Customers />} />} {/* Merchants see customers */}
                {user.role === "Customer" && <Route path="cards" element={<Cards />} />} {/* Customers see cards */}
            </Routes>
        </div>
    );
}

export default Dashboard;
