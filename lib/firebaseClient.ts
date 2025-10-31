import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD-m2vg7yH-btGrM7PqmgzI63AO4HAKZls",
  authDomain: "smartpilladvisor.firebaseapp.com",
  projectId: "smartpilladvisor",
  storageBucket: "smartpilladvisor.firebasestorage.app",
  messagingSenderId: "628159846881",
  appId: "1:628159846881:web:198a52194676de747b5aa0",
  measurementId: "G-LJTEKP66J4"
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const analytics = (() => {
  try {
    return getAnalytics(firebaseApp);
  } catch {
    return undefined;
  }
})();
