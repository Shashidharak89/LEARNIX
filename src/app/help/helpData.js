// data/helpData.js
export const DEFAULT_IMAGE = "https://res.cloudinary.com/ddycnd409/image/upload/v1761484468/users/NU25MCA117/Research%20Methodology%20and%20Publication%20Ethics/Assignment%201%20-%20Review%20paper/jnmpibrmfnz5t1npksuq.jpg";

export const SLIDER_IMAGES = [
  DEFAULT_IMAGE,
  DEFAULT_IMAGE,
  DEFAULT_IMAGE
];

export const STEPS_DATA = {
  gettingStarted: [
    {
      title: "Create an Account",
      description: "Click on 'Login / Register' in the sidebar and choose 'Register'. Enter your full name, University Seat Number (USN), and choose a password.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Complete Your Profile",
      description: "After registration, visit your profile page to add a profile picture and update your information.",
      image: DEFAULT_IMAGE
    },
    {
      title: "Explore Study Materials",
      description: "Browse through available study materials by subject. You can view and download materials shared by others.",
      image: DEFAULT_IMAGE
    }
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