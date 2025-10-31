import admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getAdminApp() {
  // Check if app already exists
  if (app) return app;
  
  // Check if default app already initialized
  try {
    app = admin.app();
    return app;
  } catch {
    // App doesn't exist, initialize it
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "smartpilladvisor";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      return app;
    } catch (error: any) {
      if (error.code === 'app/duplicate-app') {
        app = admin.app();
        return app;
      }
      throw error;
    }
  }

  // Fallback: try application default credentials
  try {
    app = admin.initializeApp({ projectId });
    return app;
  } catch {
    return null;
  }
}

export function getDb() {
  const a = getAdminApp();
  if (!a) return null;
  try {
    return admin.firestore();
  } catch {
    return null;
  }
}
