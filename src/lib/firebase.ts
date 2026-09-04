import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocFromServer,
  Timestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Interaction } from "../types";

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Cloud Firestore with custom database ID from config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection verification test per Firebase skill instructions
(async function testFirestoreConnection() {
  try {
    // Attempt lightweight server read to verify connectivity
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error?.message && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline. Verify connectivity and configuration.");
    }
  }
})();

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively strips any `undefined` values from payloads before passing them to Firestore.
 */
export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return null as any;
  }
  if (Array.isArray(payload)) {
    return payload
      .filter((item) => item !== undefined)
      .map((item) => sanitizePayload(item)) as any;
  }
  if (typeof payload === "object" && !(payload instanceof Timestamp)) {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) {
        sanitized[key] = sanitizePayload(value);
      }
    }
    return sanitized as T;
  }
  return payload;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google sign in failed:", error);
    // If popup is blocked by an iframe sandbox, advise or allow seamless fallback
    throw error;
  }
}

/**
 * Anonymous / Guest Sign In fallback
 * (Essential for testing in restricted iframe preview environments)
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * User-isolated Firestore operations under /users/{userId}/interactions/{interactionId}
 */
export async function saveUserInteraction(
  userId: string,
  interaction: Interaction
): Promise<void> {
  if (!userId) {
    throw new Error("Cannot persist interaction: Missing user identity.");
  }
  if (!interaction.id) {
    throw new Error("Cannot persist interaction: Missing interaction ID.");
  }

  const docRef = doc(db, "users", userId, "interactions", interaction.id);
  const cleanData = sanitizePayload({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(docRef, cleanData, { merge: true });
}

/**
 * Fetch all interactions for the authenticated user ordered by creation time
 */
export async function fetchUserInteractions(userId: string): Promise<Interaction[]> {
  if (!userId) return [];

  const interactionsRef = collection(db, "users", userId, "interactions");
  const q = query(interactionsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const list: Interaction[] = [];
  snapshot.forEach((d) => {
    list.push(d.data() as Interaction);
  });
  return list;
}

/**
 * Delete a specific user interaction
 */
export async function deleteUserInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = doc(db, "users", userId, "interactions", interactionId);
  await deleteDoc(docRef);
}
