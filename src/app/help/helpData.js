// data/helpData.js
export const DEFAULT_IMAGE = "https://res.cloudinary.com/ddycnd409/image/upload/v1761499257/c1_20251026_22500355_eajjdd.jpg";

export const SLIDER_IMAGES = [
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761499257/c1_20251026_22500355_eajjdd.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497653/c1_20251026_22210915_txdxug.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497655/c1_20251026_22210901_ollncb.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497654/c1_20251026_22210867_xan8me.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497654/c1_20251026_22210852_ilsgen.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497654/c1_20251026_22210834_bkxrpv.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497654/c1_20251026_22210877_g3imci.jpg",
    "https://res.cloudinary.com/ddycnd409/image/upload/v1761497653/c1_20251026_22210889_srvwqd.jpg"

];

export const STEPS_DATA = {
    gettingStarted: [
        {
            title: "Click on Login button",
            description: "Click on Login button to Register or Login with existing account",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498522/c1_20251026_22373142_hjs7xt.jpg"
        },
        {
            title: "Alternatively, use the sidebar menu",
            description: "Open the sidebar menu and select Login / Register option to access the login page.",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498522/c1_20251026_22373123_vepzky.jpg"
        },
        {
            title: "Register",
            description: "Here you see the registration form. Fill in your Name, USN and Password to create a new account.",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498521/c1_20251026_22373176_owuiyk.jpg"
        },
        {
            title: "Creating new account",
            description: "After visiting to Register tab, fill in your Name, USN and Password to create a new account. Using this format and in University Seat Number field you have to fill it with your USN or Registration Number.",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498521/c1_20251026_22373164_rwylkb.jpg"
        },
        {
            title: "Login",
            description: "If you already have an account, switch to the Login tab and enter your USN and Password to access your account.",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498520/c1_20251026_22373188_j0tcfe.jpg"
        },
        {
            title: "Login with existing account",
            description: "You can login using your existing account by entering your University Seat Number and Password in the Login tab like this.",
            image: "https://res.cloudinary.com/ddycnd409/image/upload/v1761498522/c1_20251026_22373154_fvigiy.jpg"
        },
    ],
    uploading: [
        {
            title: "Select Subject",
            description: "Choose the subject for which you want to upload materials. If the subject doesn't exist, you can create a new one.",
            image: DEFAULT_IMAGE
        },
        {
            title: "Choose Files",
            description: "Select the PDF files you want to upload. Make sure they're properly named and organized.",
            image: DEFAULT_IMAGE
        },
        {
            title: "Add Details",
            description: "Provide a description and any relevant tags to help others find your materials.",
            image: DEFAULT_IMAGE
        }
    ]
};

export const PROFILE_FEATURES = [
    {
        image: DEFAULT_IMAGE,
        alt: "Profile Settings",
        title: "Profile Settings",
        description: "Customize your profile picture and update personal information."
    },
    {
        image: DEFAULT_IMAGE,
        alt: "Security Settings",
        title: "Security",
        description: "Change your password and manage account security settings."
    }
];

export const LIST_SECTIONS = [
    {
        title: "Using Study Materials",
        subtitle: "Accessing Materials",
        intro: "You can access study materials by:",
        items: [
            "Browsing through subjects in the Study Materials section",
            "Using the search function to find specific topics",
            "Checking recent uploads on the dashboard"
        ],
        imageAlt: "Accessing Materials",
        imageSrc: DEFAULT_IMAGE
    },
    {
        title: "Providing Feedback",
        subtitle: null,
        intro: "Your feedback helps us improve! You can:",
        items: [
            "Rate study materials",
            "Report inappropriate content",
            "Suggest improvements",
            "Contact administrators"
        ],
        imageAlt: "Feedback System",
        imageSrc: DEFAULT_IMAGE
    }
];