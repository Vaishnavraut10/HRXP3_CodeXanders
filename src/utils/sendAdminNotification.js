import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Sends a notification to the adminNotifications Firestore collection.
 * 
 * @param {Object} params
 * @param {string} params.title - New Device Login
 * @param {string} params.message - Notification message
 * @param {"info" | "warning" | "error"} [params.severity="info"] - Severity level
 */
export async function sendAdminNotification({ title, message, severity = "info" }) {
  try {
    await addDoc(collection(db, "adminNotifications"), {
      title,
      message,
      severity,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("❌ Failed to send admin notification", err);
  }
}