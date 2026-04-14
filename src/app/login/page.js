import { Navbar } from "../components/Navbar";
import Login from "./Login";

export default function signin() {
    const googleClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";

    return (
        <div >
            <Navbar />
            <Login googleClientId={googleClientId} />
        
        </div>
    );
}
