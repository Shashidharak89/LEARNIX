import { Navbar } from "../components/Navbar";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import DataWeCollect from "./DataWeCollect";

export default function Privacy() {
  return (
    <div>
      <Navbar />
      <PrivacyPolicyPage />
      <DataWeCollect />
    </div>
  );
}
