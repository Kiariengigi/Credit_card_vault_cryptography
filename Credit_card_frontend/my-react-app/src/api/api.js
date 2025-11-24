import axios from "axios";

const API_URL = "https://credit-card-vault-cryptography.onrender.com"
const api = axios.create({
    baseURL: `${API_URL}`, // Flask backend URL
    withCredentials: true
});

export default api;
