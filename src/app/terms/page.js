import { Navbar } from "../components/Navbar";
import TermsPage from "./TermsPage";
import "./styles/TermsPage.css";

export default function Terms() {
  return (
    <div>
      <Navbar />
      <TermsPage />
      <footer className="tp-footer" aria-hidden={true}>
        <small className="tp-footnote">© Learnix — Terms last updated: February 4, 2026</small>
      </footer>
    </div>
  );
}
