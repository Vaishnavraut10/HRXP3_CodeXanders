"use client";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import AdminNavbar from "@/app/components/AdminNavbar";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(collection(db, "adminNotifications"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching admin notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="container">
      <AdminNavbar />
      <h2>📢 Admin Notifications</h2>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No admin notifications available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notifications.map((note) => (
            <li
              key={note.id}
              style={{
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                backgroundColor:
                  note.severity === "error"
                    ? "#f8d7da"
                    : note.severity === "warning"
                    ? "#fff3cd"
                    : "#d1ecf1",
                borderLeft: `5px solid ${
                  note.severity === "error"
                    ? "#dc3545"
                    : note.severity === "warning"
                    ? "#ffc107"
                    : "#17a2b8"
                }`,
              }}
            >
              <strong>{note.title}</strong>
              <p style={{ margin: "5px 0" }}>{note.message}</p>
              <small style={{ color: "#555" }}>
                {note.timestamp?.toDate
                  ? note.timestamp.toDate().toLocaleString()
                  : new Date(note.timestamp?.seconds * 1000).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}