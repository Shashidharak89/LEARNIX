import FeedbackDataSection from "./FeedbackDataSection";
import SavedContentLocalStorageSection from "./SavedContentLocalStorageSection";
import ToolsDataSection from "./ToolsDataSection";
import UploadedContentDataSection from "./UploadedContentDataSection";
import UserCredentialsDataSection from "./UserCredentialsDataSection";
import "./styles/TermsPage.css";

const TermsData = () => {
    return (
        <div className="tp-page-container">
            <main className="tp-main" role="main">
                <section className="tp-card tp-intro" aria-labelledby="tp-data-title">
                    <h1 id="tp-data-title" className="tp-title">Data We Collect</h1>
                    <p className="tp-plain">
                        Learn about the types of data we collect and how we handle your information on Learnix.
                    </p>
                </section>
                <UserCredentialsDataSection />
                <UploadedContentDataSection />
                <SavedContentLocalStorageSection />
                <FeedbackDataSection />
                <ToolsDataSection />
            </main>
        </div>
    );
};

export default TermsData;