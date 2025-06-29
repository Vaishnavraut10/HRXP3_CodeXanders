"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "./login.css";
import { sendAdminNotification } from "../utils/sendAdminNotification";

export default function Home() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          role: "employee",
        });
      }
      await sendAdminNotification({
        title: "New Device Login",
        message: `User ${user.email} logged in from a new browser/device.`,
        severity: "info",
      });

      // 🔐 Redirect to face verification page
      router.push("/verify");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div class="main_container">

    
    <div className="login_container">
      <h1 className="heading">🔒 Z-Secure</h1>

      {/* 🌐 Google Login */}
      <button className="login_with_google" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>

      <p
        style={{
          textAlign: "center",
          fontSize: "22px",
          margin: "20px 0 -5px 0",
        }}
      >
        or
      </p>

      {/* 🧪 Placeholder login form (disabled) */}
      <form onSubmit={(e) => e.preventDefault()} className="input_class">
        <div className="input">
          <input type="email" placeholder="Enter Your Email " />
        </div>
        <div className="input">
          <input type="password" placeholder="Enter your Password " />
        </div>
        <button className="login">Login</button>
      </form>
    </div>
    </div>
  );
}
