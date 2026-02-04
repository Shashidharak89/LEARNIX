import FeedbackDataSection from "./FeedbackDataSection";
import SavedContentLocalStorageSection from "./SavedContentLocalStorageSection";
import ToolsDataSection from "./ToolsDataSection";
import UploadedContentDataSection from "./UploadedContentDataSection";
import UserCredentialsDataSection from "./UserCredentialsDataSection";

const TermsData = () => {
    return (
        <>
        <h1>Data We Collect</h1>
            <UserCredentialsDataSection />
            <UploadedContentDataSection/>
            <SavedContentLocalStorageSection/>
            <FeedbackDataSection/>
            <ToolsDataSection/>
        </>
    );
};

export default TermsData;