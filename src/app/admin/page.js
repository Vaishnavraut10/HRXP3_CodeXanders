"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import AdminNavbar from "../components/AdminNavbar";
import "./admin.css";

export default function AdminPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterEmail, setFilterEmail] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/");

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data().role === "admin") {
        setAuthorized(true);
        fetchLogs();
        fetchUsers();
        fetchAnnouncements();
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
      data = data.filter((log) =>
        log.email.toLowerCase().includes(filterEmail.toLowerCase())
      );
    }

    if (startDate && endDate) {
      data = data.filter((log) => {
        const time = new Date(log.time?.seconds * 1000);
        return time >= startDate && time <= endDate;
      });
    }

    setLogs(data.sort((a, b) => b.time?.seconds - a.time?.seconds));
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    setUsers(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "employee" : "admin";
    await updateDoc(doc(db, "users", id), { role: newRole });
    fetchUsers();
  };

  const toggleBlock = async (id, isBlocked) => {
    await updateDoc(doc(db, "users", id), { blocked: !isBlocked });
    fetchUsers();
  };

  const postAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementText.trim()) {
      alert("Title and message are required.");
      return;
    }

    await addDoc(collection(db, "announcements"), {
      title: announcementTitle,
      message: announcementText,
      timestamp: serverTimestamp(),
    });

    setAnnouncementText("");
    setAnnouncementTitle("");
    fetchAnnouncements();
  };

  const fetchAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    setAnnouncements(snapshot.docs.map((doc) => doc.data()));
  };

  if (!authorized) return <div className="container">Checking admin access...</div>;

  return (
    <div className="admin_container">
      <AdminNavbar />

      {/* 🔔 Admin Notifications */}
      <section className="notification" style={{ marginTop: "20px" }}>
        <button
          className="notification-btn"
          onClick={() => router.push("/admin/notifications")}
        >
          🔔 View Admin Notifications
        </button>
      </section>

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
        <h3>User Manager</h3>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Toggle Role</th>
              <th>Block</th>
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
                <td>
                  <button
                    className={`block-btn ${u.blocked ? "blocked" : "unblocked"}`}
                    onClick={() => toggleBlock(u.id, u.blocked)}
                  >
                    {u.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 📬 Announcement Publisher */}
      <section className="announcement_publisher">
        <h3>📬 Announcement Publisher</h3>
        <button style={{ marginTop: "10px" }} onClick={postAnnouncement}>
          ➕ Post Announcement
        </button>
        <input
          type="text"
          placeholder="Title"
          value={announcementTitle}
          onChange={(e) => setAnnouncementTitle(e.target.value)}
          style={{ width: "92.5%", padding: "8px", margin:"25px 20px 10px 20px" }}
        />
        <textarea 
          placeholder="Write your announcement here..."
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          rows={4}
          style={{ width: "90%", padding: "20px" ,margin:"1px 0 5px 20px" }}
        />
        <button style={{ marginTop: "10px" }} onClick={postAnnouncement}>
          ➕ Post Announcement
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
    </div>
  );
}