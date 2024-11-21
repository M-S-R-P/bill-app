import { useState } from "react";
import "./App.css";
import { LoginComponent } from "./components/LoginComponent";
import axios from "axios";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem("token") ? true : false;
    });

    const [bills, setBills] = useState([]);

    const handleLogin = async (username, password) => {
        try {
            const response = await axios.post("http://localhost:5000/login", {
                username,
                password,
            });
            localStorage.setItem("token", response.data.token);
            setIsLoggedIn(true);
        } catch (err) {
            window.alert("Incorrect Username/Password");
            console.log(err);
        }
    };

    return <LoginComponent onLogin={handleLogin} />;
    w;
}

export default App;
