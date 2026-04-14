import { Navbar } from "../components/Navbar";
import Signup from "./Signup";

export default function register() {
  const googleClientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";

  return (
    <div>
      <Navbar />
      <Signup googleClientId={googleClientId} />
    </div>
  );
}
