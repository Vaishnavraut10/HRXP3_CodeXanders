"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import Link from "next/link";
import AdminNavbar from "../../components/AdminNavbar";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { getBrowserName } from "../../../utils/parseBrowser";
import { getDeviceOS } from "../../../utils/parseDevice";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AnalyticsPage() {
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [browserData, setBrowserData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [filterEmail, setFilterEmail] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8e44ad"];
  const exportToCSV = () => {
    const headers = ["Email", "Page", "Browser", "Device", "Time"];
    const rows = logs.map((log) => [
      log.email,
      log.page,
      log.browser,
      log.device,
      new Date(log.time?.seconds * 1000).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "access_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    const verifyAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return router.push("/");
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role === "admin") {
        setAuthorized(true);
        fetchLogs();
      } else {
        alert("Access denied. Admins only.");
        router.push("/");
      }
    };

    verifyAdmin();
  }, [router]);

  const fetchLogs = async () => {
    const snapshot = await getDocs(collection(db, "logs"));
    const data = snapshot.docs.map((doc) => doc.data());

    let filtered = data;
    if (filterEmail.trim()) {
      filtered = filtered.filter((log) =>
        log.email.includes(filterEmail.trim())
      );
    }
    if (startDate && endDate) {
      filtered = filtered.filter((log) => {
        const t = new Date(log.time?.seconds * 1000);
        return t >= startDate && t <= endDate;
      });
    }

    setLogs(filtered);
    processLogData(filtered);
    processBrowserData(filtered);
    processDeviceData(filtered);
  };

  const processLogData = (logs) => {
    const map = {};
    logs.forEach((log) => {
      const date = new Date(log.time?.seconds * 1000).toLocaleDateString();
      map[date] = (map[date] || 0) + 1;
    });
    setChartData(Object.keys(map).map((date) => ({ date, logins: map[date] })));
  };

  const processBrowserData = (logs) => {
    const count = {};
    logs.forEach((log) => {
      const browser = getBrowserName(log.browser || "");
      count[browser] = (count[browser] || 0) + 1;
    });
    setBrowserData(
      Object.keys(count).map((name) => ({ name, value: count[name] }))
    );
  };

  const processDeviceData = (logs) => {
    const count = {};
    logs.forEach((log) => {
      const os = getDeviceOS(log.device || "");
      count[os] = (count[os] || 0) + 1;
    });
    setDeviceData(
      Object.keys(count).map((name) => ({ name, count: count[name] }))
    );
  };

  if (!authorized) return <div className="container">Checking access...</div>;

  return (
    <div className={`container ${darkMode ? "dark" : ""}`}>
      <AdminNavbar />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h2>📊 Analytics Dashboard</h2>
        <button
          onClick={() => {
            setDarkMode(!darkMode);
            setTimeout(fetchLogs, 0); // Re-fetch with new theme
          }}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Filter by email"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
        />
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Start Date"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          placeholderText="End Date"
        />
        <button onClick={fetchLogs}>Apply Filters</button>
      </div>

      {/* Charts */}
      {logs.length === 0 && (
        <p style={{ color: "gray" }}>No logs found for the selected filters.</p>
      )}

      {logs.length > 0 && (
        <>
          <h3>Login Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="logins"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>

          <h3>Browser Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={browserData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {browserData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <h3>Device OS Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
      <button onClick={exportToCSV} style={{ marginBottom: "10px" }}>
        🖨 Export Logs as CSV
      </button>
    </div>
  );
}
