import { Navbar } from "../components/Navbar";
import TermsData from "./TermsData";
import TermsPage from "./TermsPage";

export default function Terms() {
  return (
    <div>
      <Navbar />
      <TermsPage/>
      <TermsData/>
      <footer className="tp-footer" aria-hidden={true}>
        <small className="tp-footnote">© Learnix — Terms last updated: February 4, 2026</small>
      </footer>
      
    </div>
  );
}
