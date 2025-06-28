"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { checkDeviceSecurity } from "../../utils/deviceCheck";
import { signOut } from "firebase/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [deviceInfo, setDeviceInfo] = useState({});
  const [myLogs, setMyLogs] = useState([]);
  const [personalChartData, setPersonalChartData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const info = checkDeviceSecurity();
    setDeviceInfo(info);

    const logAccess = async () => {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "logs", `${user.uid}-${Date.now()}`), {
          email: user.email,
          time: serverTimestamp(),
          page: "dashboard",
          browser: navigator.userAgent,
          device: navigator.platform,
          isSafe: info.isSafe,
          isRooted: info.isRooted,
        });
      }
    };

    const fetchMyLogs = async () => {
      const user = auth.currentUser;
      if (!user) return [];
      const q = query(collection(db, "logs"), where("email", "==", user.email));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => b.time?.seconds - a.time?.seconds);
      setMyLogs(data);
      return data;
    };

    const fetchAnnouncements = async () => {
      const snapshot = await getDocs(collection(db, "announcements"));
      const data = snapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setAnnouncements(data);
    };

    const processLogData = (logs) => {
      const map = {};
      logs.forEach((log) => {
        const date = new Date(log.time?.seconds * 1000).toLocaleDateString();
        map[date] = (map[date] || 0) + 1;
      });
      const result = Object.keys(map).map((date) => ({
        date,
        logins: map[date],
      }));
      setPersonalChartData(result);
    };

    logAccess();
    fetchAnnouncements();

    fetchMyLogs().then((data) => processLogData(data));
  }, []);

  return (
    <div className="container">
      <h2>Welcome, Employee</h2>
      <p>Access your HR and internal tools securely.</p>

      {/* 🔐 Security Status */}
      <p>
        🔒 Device Security Status:{" "}
        <span style={{ color: deviceInfo.isSafe ? "green" : "red" }}>
          {deviceInfo.isSafe ? "Secure" : "⚠️ Risk Detected"}
        </span>
      </p>

      {/* ⚠️ Warnings */}
      {!deviceInfo.isSafe && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          <p>⚠️ Warning: Your device may be insecure.</p>
          {deviceInfo.isRooted && <p>🚫 Rooted or Jailbroken device detected</p>}
          {deviceInfo.isOutdatedBrowser && <p>🌐 Outdated or unsupported browser</p>}
          {deviceInfo.isEmulator && <p>🧪 Emulator environment detected</p>}
          {deviceInfo.isInsecurePlatform && <p>📱 Insecure OS/platform detected</p>}
        </div>
      )}

      {/* 📋 Login Activity */}
      <h3>Your Login History</h3>
      {myLogs.length === 0 ? (
        <p>No login records yet.</p>
      ) : (
        <ul>
          {myLogs.map((log, i) => (
            <li key={i}>
              <strong>{log.page}</strong> from {log.device} at{" "}
              {new Date(log.time?.seconds * 1000).toLocaleString()}
            </li>
          ))}
        </ul>
      )}

      {/* 📢 Announcements */}
      <h3>📢 Admin Announcements</h3>
      {announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        <ul>
          {announcements.map((a, i) => (
            <li key={i} style={{ marginBottom: "1rem" }}>
              <strong>{a.title}</strong> <br />
              <span>{a.message}</span> <br />
              <small>
                {new Date(a.timestamp?.seconds * 1000).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}

      {/* 📈 Chart */}
      <h3>📈 Your Login Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={personalChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="logins"
            stroke="#00C49F"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 🚪 Logout */}
      <button
        onClick={() => {
          signOut(auth);
          window.location.href = "/";
        }}
        style={{ marginTop: "20px" }}
      >
        Logout
      </button>
    </div>
  );
}