import axios from "axios";

// Prefer a local backend during development. Falls back to the deployed URL otherwise.
const DEFAULT_REMOTE = "https://credit-card-vault-cryptography.onrender.com";
const API_URL = import.meta.env.VITE_API_URL ||
    ((window && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'https://credit-card-vault-cryptography.onrender.com'
        : DEFAULT_REMOTE);

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export default api;
