import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      dashboard: "Dashboard",
      groups: "My Groups",
      profile: "Profile",
      logout: "Logout",
      login: "Login",
      register: "Register",
      createGroup: "Create Group",
      joinGroup: "Join Group",
      contribute: "Contribute",
      payout: "Payout",
      notifications: "Notifications",
      totalContributed: "Total Contributed",
      totalReceived: "Total Received",
      pendingPayments: "Pending Payments",
      activeGroups: "Active Groups",
      payNow: "Pay Now",
      members: "Members",
      monthlyAmount: "Monthly Amount",
      duration: "Duration",
      status: "Status",
      admin: "Admin",
    },
  },
  mr: {
    translation: {
      dashboard: "डॅशबोर्ड",
      groups: "माझे गट",
      profile: "प्रोफाइल",
      logout: "बाहेर पडा",
      login: "लॉगिन",
      register: "नोंदणी",
      createGroup: "गट तयार करा",
      joinGroup: "गटात सामील व्हा",
      contribute: "योगदान द्या",
      payout: "पेआउट",
      notifications: "सूचना",
      totalContributed: "एकूण योगदान",
      totalReceived: "एकूण प्राप्त",
      pendingPayments: "प्रलंबित देयके",
      activeGroups: "सक्रिय गट",
      payNow: "आता पैसे द्या",
      members: "सदस्य",
      monthlyAmount: "मासिक रक्कम",
      duration: "कालावधी",
      status: "स्थिती",
      admin: "प्रशासक",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
