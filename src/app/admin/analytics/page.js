"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/config";
import Link from "next/link";
import AdminNavbar from "../../components/AdminNavbar";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import "./page.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getBrowserName } from "../../../utils/parseBrowser";
import { getDeviceOS } from "../../../utils/parseDevice";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function AnalyticsPage() {
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [authorized, setAuthorized] = useState(false);
  const [filterEmail, setFilterEmail] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [retryLimit] = useState(5);
  const router = useRouter();

  // ✅ Dummy device data
  const deviceData = [
    { name: "Windows", count: 10 },
    { name: "MacOS", count: 6 },
    { name: "Linux", count: 4 },
    { name: "Android", count: 8 },
    { name: "iOS", count: 5 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8e44ad"];

  const exportToCSV = () => {
    const headers = ["Email", "Page", "Browser", "Device", "Location", "Time"];
    const rows = logs.map((log) => [
      log.email,
      log.page,
      log.browser,
      log.device,
      log.location?.city || "",
      new Date(log.time.seconds * 1000).toLocaleString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const verify = async () => {
      const u = auth.currentUser;
      if (!u) return router.push("/");
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists() && snap.data().role === "admin") {
        setAuthorized(true);
        await fetchLogs();
      } else {
        alert("Access denied.");
        router.push("/");
      }
    };
    verify();
  }, [router]);

  const fetchLogs = async () => {
    const snap = await getDocs(collection(db, "logs"));
    let arr = snap.docs.map((d) => d.data());
    if (filterEmail) arr = arr.filter((l) => l.email.includes(filterEmail));
    if (startDate && endDate) {
      arr = arr.filter((l) => {
        const t = new Date(l.time.seconds * 1000);
        return t >= startDate && t <= endDate;
      });
    }
    setLogs(arr);
    processTimeline(arr);
  };

  const processTimeline = (arr) => {
    const map = {};
    arr.forEach((l) => {
      const d = new Date(l.time.seconds * 1000).toLocaleDateString();
      map[d] = (map[d] || 0) + 1;
    });
    setChartData(
      Object.entries(map).map(([date, logins]) => ({ date, logins }))
    );
  };

  if (!authorized) return <div className="container">Checking access...</div>;

  const mapCenter = logs.find((l) => l.location?.coord)?.location.coord ?? [
    20.5937, 78.9629,
  ];

  return (
    <div className="container_analytics">
      <AdminNavbar />

      {/* Filters */}
      <div className="map_filter_cont">
        <div className="analytics_filter">
          <input
            className="analytics_input"
            placeholder="Filter by email"
            value={filterEmail}
            onChange={(e) => setFilterEmail(e.target.value)}
          />
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            placeholderText="Start Date"
            className="analytics_input"
          />
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            placeholderText="End Date"
            className="analytics_input"
          />
          <button className="analytics_filter_btn" onClick={fetchLogs}>
            Apply Filters
          </button>
        </div>

        <div className="map_wrapper">
          <MapContainer
            className="map"
            center={mapCenter}
            zoom={4}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {logs.map((l, i) =>
              l.location?.coord ? (
                <Marker key={i} position={l.location.coord}>
                  <Popup>
                    {l.email} @ {l.location.city}, {l.location.country}
                    <br />
                    {new Date(l.time.seconds * 1000).toLocaleString()}
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      </div>

      {/* Timeline Chart */}
      {chartData.length > 0 && (
        <div className="chart_container">
          <h3>Login Trend</h3>
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
        </div>
      )}

      {/* Dummy Device OS Charts */}
      <div className="chart_container" style={{ margin: "20px 0 0 0" }}>
        <h3 className="chart_title">Dummy Device OS Breakdown</h3>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={deviceData.map((d) => ({
              ...d,
              count: Number(d.count),
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#00C49F" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div class="pie_chart" style={{width:"50%"}}>
          <div
            style={{
              width: "70%",
              height: 300,
              marginTop: "2rem",
              position: "absolute",
              top: "70%",
              right: "-30%",
              background: "#56567c",
            }}
          >
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Pie
                  data={deviceData.map((d) => ({
                    ...d,
                    count: Number(d.count),
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <button className="analytics_filter_btn" onClick={exportToCSV}>
        🖨 Export CSV
      </button>
    </div>
  );
}
