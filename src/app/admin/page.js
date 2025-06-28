"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getDeviceOS } from "../../utils/parseDevice";
import { getBrowserName } from "../../utils/parseBrowser";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import AdminNavbar from "../components/AdminNavbar";
import Link from "next/link";
import "./admin.css";

export default function AdminPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterEmail, setFilterEmail] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [browserData, setBrowserData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/");

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role === "admin") {
        setAuthorized(true);
        fetchLogs();
        fetchUsers();
      } else {
        alert("Access denied. Admins only.");
        router.push("/");
      }
    };
    verifyAdmin();
  }, [router]);

  const fetchLogs = async () => {
    const snapshot = await getDocs(collection(db, "logs"));
    let data = snapshot.docs.map((doc) => doc.data());

    if (filterEmail.trim()) {
      data = data.filter((log) => log.email.includes(filterEmail.trim()));
    }

    if (startDate && endDate) {
      data = data.filter((log) => {
        const time = new Date(log.time?.seconds * 1000);
        return time >= startDate && time <= endDate;
      });
    }

    setLogs(data.sort((a, b) => b.time?.seconds - a.time?.seconds));
    processDeviceData(data);
    processBrowserData(data);
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(data);
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "employee" : "admin";
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, { role: newRole });
    fetchUsers();
  };

  const processBrowserData = (logs) => {
    const count = {};
    logs.forEach((log) => {
      const browser = getBrowserName(log.browser || "");
      count[browser] = (count[browser] || 0) + 1;
    });

    setBrowserData(
      Object.entries(count).map(([name, value]) => ({ name, value }))
    );
  };

  const processDeviceData = (logs) => {
    const count = {};
    logs.forEach((log) => {
      const os = getDeviceOS(log.device || "");
      count[os] = (count[os] || 0) + 1;
    });

    setDeviceData(
      Object.entries(count).map(([name, count]) => ({ name, count }))
    );
  };

  if (!authorized)
    return <div className="container">Checking admin access...</div>;

  return (
    <div className="admin_container">
      <AdminNavbar />

      {/* 🔍 Filters */}
      <section className="filter_logs">
        <h3>Filter Logs</h3>
        <div className="filters">
          <input
            className="filter_input"
            type="text"
            placeholder="Filter by email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
          />
          <DatePicker
            className="filter_input"
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
          />
          <DatePicker
            className="filter_input"
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
          />
          <button className="apply_filter_btn" onClick={fetchLogs}>
            Apply Filters
          </button>
        </div>
      </section>

      {/* 👥 User Manager */}
      <section className="user_manager">
        <h3>User Role Manager</h3>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={() => toggleRole(u.id, u.role)}>
                    Make {u.role === "admin" ? "Employee" : "Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 🔔 Admin Notifications Button */}
      <section style={{ marginTop: "20px" }}>
        <button
          className="notification-btn"
          onClick={() => router.push("/admin/notifications")}
        >
          🔔 View Admin Notifications
        </button>
      </section>

      {/* 📜 Recent Logs */}
      <section className="access_logs">
        <h3>Recent Access Logs</h3>
        {logs.length === 0 ? (
          <p>No logs found for selected filters.</p>
        ) : (
          <ul>
            {logs.map((log, i) => (
              <li key={i}>
                <strong>{log.email}</strong> accessed <em>{log.page}</em> from{" "}
                {log.device} at{" "}
                {new Date(log.time?.seconds * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 🚪 Logout */}
      <button
        className="logout-btn"
        onClick={() => {
          signOut(auth);
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}
