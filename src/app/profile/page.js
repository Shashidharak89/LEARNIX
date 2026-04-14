import { Navbar } from "../components/Navbar";
import UserProfile from "./UserProfile";


export default function profile() {
    const googleClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";

    return (
        <div >
            <Navbar />
            <UserProfile googleClientId={googleClientId} />
        </div>
    );
}
