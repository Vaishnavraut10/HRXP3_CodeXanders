"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendAdminNotification } from "../../utils/sendAdminNotification"; // Make sure this exists

export default function FallbackPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      // Log fallback to Firestore
      const logRef = doc(db, "faceLogs", `${user.uid}-fallback-${Date.now()}`);
      setDoc(logRef, {
        uid: user.uid,
        email: user.email,
        result: "fallback",
        time: serverTimestamp(),
      });

      // Send realtime admin notification
      sendAdminNotification({
        title: "Fallback Used",
        message: `User ${user.email} was redirected to fallback after failed verification.`,
        severity: "info",
      });
    }

    // Countdown & redirect
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      router.push("/");
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div
      className="container"
      style={{ textAlign: "center", marginTop: "3rem" }}
    >
      <h2>🚫 Face Verification Failed</h2>
      <p>We were unable to detect your face after multiple attempts.</p>
      <p>
        A fallback access log has been recorded. You’ll be redirected in{" "}
        <b>{countdown}</b> seconds.
      </p>
      <p>
        Please ensure your webcam is working or contact your administrator for
        help.
      </p>
      <button onClick={() => router.push("/")}>⬅ Go Back to Login</button>
    </div>
  );
}
