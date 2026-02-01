import MultiTagInPagePush from "../../components/MultiTagInPagePush";
import HillTopAds from "../../components/HillTopAds";
import VideoAdEmbed from "../../components/VideoAdEmbed";
import VastVideoPlayer from "../../components/VastVideoPlayer";
import VideoSliderMultiTag from "../../components/VideoSliderMultiTag";
import MultiTagBanner300x100 from "../../components/MultiTagBanner300x100";
import MultiTagBanner300x250 from "../../components/MultiTagBanner300x250";
import { Navbar } from "@/app/components/Navbar";

export default function AdsTestPage() {

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px" }}>
            <Navbar />
            <h1>Ads Test Page</h1>
            <p>
                This page is created to preview and test all ad integrations in one place. Here you can see how each ad format appears and behaves, including popunder, video embed, VAST video player, and the MultiTag video slider. Use this page for debugging, demonstration, or to verify ad placements and functionality before deploying site-wide.
            </p>
            <hr style={{ margin: "32px 0" }} />
            <h2>MultiTag In-Page Push</h2>
            <MultiTagInPagePush />
            <h2>HillTopAds (Popunder)</h2>
            <HillTopAds />
            <h2>Video Ad Embed</h2>
            <VideoAdEmbed />
            <h2>VAST Video Player</h2>
            <VastVideoPlayer />
            <h2>MultiTag Video Slider</h2>
            <VideoSliderMultiTag />
            <h2>MultiTag Banner 300x100 (Mobile Only)</h2>
            <MultiTagBanner300x100 />
            <h2>MultiTag Banner 300x250 (Desktop & Mobile)</h2>
            <MultiTagBanner300x250 />
        </div>
    );
}
