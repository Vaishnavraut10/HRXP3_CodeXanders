'use client';
import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../firebase/config';
import * as faceapi from 'face-api.js';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function VerifyPage() {
  const [status, setStatus] = useState('Loading...');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const videoRef = useRef();

  useEffect(() => {
    const loadModelsAndStart = async () => {
      setStatus('Initializing face verification...');

      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      let attempts = 0;
      const interval = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        attempts++;
        setRetryCount(attempts);

        if (detections.length > 0) {
          clearInterval(interval);
          setStatus('Face detected ✅');

          const user = auth.currentUser;
          await setDoc(doc(db, 'faceLogs', `${user.uid}-${Date.now()}`), {
            uid: user.uid,
            email: user.email,
            time: serverTimestamp(),
            result: 'success',
            retries: attempts,
          });

          // Role-based redirect
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          const role = userSnap.exists() && userSnap.data().role === 'admin' ? 'admin' : 'dashboard';
          router.push(`/${role}`);
        }

        if (attempts >= 5) {
          clearInterval(interval);
          setStatus('Face not detected. Please try again or use fallback.');
          const user = auth.currentUser;
          await setDoc(doc(db, 'faceLogs', `${user.uid}-${Date.now()}`), {
            uid: user.uid,
            email: user.email,
            time: serverTimestamp(),
            result: 'failed',
            retries: attempts,
          });

          setTimeout(() => {
            router.push('/fallback'); // optional: route to a fallback support page
          }, 5000);
        }
      }, 3000);
    };

    loadModelsAndStart();
  }, []);

  return (
    <div className="container">
      <h2>Face Verification</h2>
      <video
        ref={videoRef}
        width="300"
        height="300"
        style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #ccc' }}
        muted
      />
      <p>{status}</p>
      <p>Attempts: {retryCount}/5</p>
    </div>
  );
}