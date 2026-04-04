import react from "react";
import { Link } from "react-router-dom";

function Welcome() {
    return (
        <div>
            <h1>Welcome to the Welcome Page</h1>
            <Link to="/home">Go to Home</Link>
        </div>
    )

}


export default Welcome;