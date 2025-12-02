import React, { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Customers from "./Customers";
import Cards from "./Cards";

function Dashboard({ user }) {
    const [role, setRole] = useState(null);

    useEffect(() => {
        // Fetch role from local storage
        const storedRole = localStorage.getItem("userRole");
        console.log(storedRole)
        setRole(storedRole);
    }, []);

    return (
        <div>
            <h2>Welcome, {user.username}</h2>
            <nav>
                {storedRole === "Merchant" && <Link to="customers">Customers</Link>} {/* Merchants see customers */}
                {storedRole === "Merchant" && " | "}
                {storedRole === "Customer" && <Link to="cards">Cards</Link>} {/* Customers see cards */}
            </nav>
            <Routes>
                {storedRole === "Merchant" && <Route path="customers" element={<Customers />} />} {/* Merchants see customers */}
                {storedRole === "Customer" && <Route path="cards" element={<Cards />} />} {/* Customers see cards */}
            </Routes>
        </div>
    );
}

export default Dashboard;
