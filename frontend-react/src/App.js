import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

import { Line } from "react-chartjs-2";

import { motion } from "framer-motion";

import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function App() {
  const [ph, setPh] = useState("");
  const [moisture, setMoisture] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [health, setHealth] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [crop, setCrop] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);


//   const handleLogin = () => {
//   const fakeUser = {
//     name: "Rishi",
//     email: "rishi@gmail.com",
//     id: "123"
//   };

//     setUser(fakeUser);
//   localStorage.setItem("user", JSON.stringify(fakeUser));
// };

const handleLogout = () => {
  setUser(null);
  localStorage.removeItem("user");
  setMessages([]);
};

  

  useEffect(() => {
  loadHistory();

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    setDarkMode(true);
    document.body.classList.add("dark");
  }

  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }

}, []);  // 🔥 ADD THIS

  const analyze = async () => {

    if (moisture < 0 || moisture > 100) {
  setMessages(prev => [
    ...prev,
    { text: "⚠️ Moisture must be between 0–100%", type: "bot" }
  ]);
  return;
}

    if (!ph || !moisture) {
  setMessages(prev => [
    ...prev,
    { text: "⚠️ Please enter pH and moisture values", type: "bot" }
  ]);
  return;
}
    setMessages(prev => [
  ...prev.filter(msg => msg.text !== "Analyzing..."),
  { text: "Analyzing...", type: "bot" }
]);

    try {
      const res = await fetch("http://127.0.0.1:3000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  ph,
  moisture,
  crop,
  userId: user?.id || null
})
      });

      const data = await res.json();

      
      setHealth(data.soil.healthScore);

      setMessages(prev =>
  prev.filter(msg => msg.text !== "Analyzing...")
);

      setMessages(prev => [
  ...prev,
  {
    text: `🌿 Soil Type: ${data.soil.soilType}
🌡️ Health Score: ${data.soil.healthScore}%
🌾 Recommendation: ${data.soil.suggestion}`,
    type: "bot"
  }
]);
loadHistory();
setPh("");
setMoisture("");

    } catch {
      setMessages(prev => [...prev, { text: "Server error", type: "bot" }]);
    }
  };

  const downloadPDF = (report) => {
  const element = document.createElement("div");

  element.innerHTML = `
    <div style="
       width:900px;
  min-width:900px;
  max-width:900px;
      padding:20px;
      font-family:Arial;
      background:white;
      page-break-inside: avoid;
    ">
      <h1 style="color:green;">🌱 Soil Health Report</h1>

      <p><strong>User:</strong> ${user?.name || "Guest"}</p>
      <p><strong>Date:</strong> ${new Date(report.date).toLocaleString()}</p>

      <hr/>

      <h3>🌱 Soil Parameters</h3>
      <p>pH: ${report.ph}</p>
      <p>Moisture: ${report.moisture}%</p>
      <p>Soil Type: ${report.soilType}</p>
      <p>Crop: ${report.crop || "Not Selected"}</p>

      <hr/>

      <h3>🌡️ Health Analysis</h3>
      <p>Score: ${report.healthScore}%</p>

      <div style="
        height:20px;
        width:100%;
        background:#ddd;
        border-radius:10px;
      ">
        <div style="
          height:20px;
          width:${report.healthScore}%;
          background:${
            report.healthScore < 40
              ? "red"
              : report.healthScore < 70
              ? "orange"
              : "green"
          };
          border-radius:10px;
          text-align:center;
          color:white;
        ">
          ${report.healthScore}%
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(element);

  // 🔥 USE html2pdf INSTEAD OF jsPDF
  window.html2pdf()
    .from(element)
    .set({
      margin: 10,
      filename: "soil-report.pdf",
      html2canvas: { scale: 2,  windowWidth: 1200 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .save()
    .then(() => {
      document.body.removeChild(element);
    });
};

  const loadHistory = async () => {
  try {
    const res = await fetch(
  `http://127.0.0.1:3000/history?userId=${user?.id || ""}`
);
    const data = await res.json();
    setHistory(data);
  } catch {
    console.log("Error loading history");
  }
};

const sendMessage = async () => {
  setMessages(prev => [
  ...prev,
  {
    text: user ? `${user.name}: ${input}` : input,
    type: "user"
  }
]);

  try {
    const res = await fetch("http://127.0.0.1:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: input })
    });

    const text = await res.text();   // 👈 SAFE
    let data;

    try {
      data = JSON.parse(text);       // 👈 Try parsing
    } catch {
      data = { reply: "Invalid response from server" };
    }

    setMessages(prev => [
      ...prev,
      { text: data.reply || "Error occurred", type: "bot" }
    ]);

  } catch {
    setMessages(prev => [
      ...prev,
      { text: "Server connection error", type: "bot" }
    ]);
  }

  setInput("");
};

const chartData = {
  labels: history.map(item =>
  `${item.soilType} (pH:${item.ph}, M:${item.moisture},H:${item.healthScore})`
),
 datasets: [
  {
    label: "Soil Health Score (0–100)",
    data: history.map(item => item.healthScore),
    borderWidth: 2,
    tension: 0.4,

     borderColor: darkMode ? "#4ade80" : "#007f00",   // 🔥 ADD
    backgroundColor: "transparent"                  // 🔥 ADD
  }
]
};

const chartOptions = {
  plugins: {
    legend: {
      labels: {
        color: darkMode ? "#ffffff" : "#000000"
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: darkMode ? "#ffffff" : "#000000"
      },
      grid: {
        color: darkMode ? "rgba(255,255,255,0.1)" : "#ccc"
      }
    },
    y: {
      ticks: {
        color: darkMode ? "#ffffff" : "#000000"
      },
      grid: {
        color: darkMode ? "rgba(255,255,255,0.1)" : "#ccc"
      }
    }
  }
};

const toggleTheme = () => {
  const newMode = !darkMode;
  setDarkMode(newMode);

  if (newMode) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  localStorage.setItem("theme", newMode ? "dark" : "light");
};

const clearAllHistory = async () => {
  await fetch("http://127.0.0.1:3000/history", { method: "DELETE" });
  loadHistory();
};

const deleteOne = async (id) => {
  await fetch(`http://127.0.0.1:3000/history/${id}`, { method: "DELETE" });
  loadHistory();
};
const newChat = () => {
  setMessages([]);
};

const handleGoogleSuccess = (credentialResponse) => {
  const decoded = jwtDecode(credentialResponse.credential);

  const userData = {
    name: decoded.name,
    email: decoded.email,
    id: decoded.sub
  };

  setUser(userData);
  localStorage.setItem("user", JSON.stringify(userData));
  loadHistory();
};
const previewReport = (item) => {
  setSelectedReport(item);
};

const openWebReport = (report) => {
  const reportHTML = `
  <html>
  <head>
    <title>Soil Report</title>
    <style>
      body {
        font-family: Arial;
        padding: 40px;
        background: #f5f5f5;
      }
      .container {
  max-width: 750px;
  margin: auto;
  background: white;
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #0a8f08;
  margin-bottom: 5px;
}

.sub {
  font-size: 12px;
  color: gray;
}

.section {
  margin-top: 25px;
}

.section h3 {
  border-left: 5px solid green;
  padding-left: 10px;
  margin-bottom: 10px;
}

.row {
  display: block;
  margin-bottom: 6px;
}
      h1 {
        color: #0a8f08;
      }
      hr {
        margin: 20px 0;
      }
      .badge {
        padding: 5px 10px;
        border-radius: 6px;
        color: white;
      }
      .good { background: green; }
      .mid { background: orange; }
      .bad { background: red; }
      button {
        margin-top: 20px;
        padding: 10px;
        background: green;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }

       @media print {
  body {
    background: white !important;
  }

  .container {
    box-shadow: none !important;
    border: 1px solid #ccc;
  }

  button {
    display: none;
  }

  /* 🔥 FORCE COLORS TO SHOW */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
  body {
  margin: 0;
}

.container {
  width: 100%;
}
  .health-bar {
  height: 22px;
  width: 100%;
  background: #ddd;
  border-radius: 12px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  color: white;
  text-align: center;
  line-height: 22px;
}
    </style>
   

  
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  </head>

  <body>
    <div class="container">
      <div class="header">
  <h1>🌱 Soil Health Report</h1>
  <div class="sub">AI-Based Soil Analysis System</div>
</div>

      <p><strong>User:</strong> ${user?.name || "Guest"}</p>
      <p><strong>Date:</strong> ${new Date(report.date).toLocaleString()}</p>

      <hr />

      <div class="section">
  <h3>🌱 Soil Parameters</h3>

  <p><strong>pH Level:</strong> ${report.ph}</p>
<p><strong>Moisture:</strong> ${report.moisture}%</p>
<p><strong>Soil Type:</strong> ${report.soilType}</p>
<p><strong>Crop:</strong> ${report.crop || "Not Selected"}</p>
</div>

      <hr />

      <div class="section">
  <h3>🌡️ Health Analysis</h3>
  <p><strong>Score:</strong> ${report.healthScore}%</p>

<p><strong>Condition:</strong> ${
  report.healthScore < 40
    ? "Poor"
    : report.healthScore < 70
    ? "Moderate"
    : "Good"
}</p>

<div class="health-bar">
  <div class="health-fill" style="
    width:${report.healthScore}%;
    background:${
      report.healthScore < 40
        ? "red"
        : report.healthScore < 70
        ? "orange"
        : "green"
    };
  ">
    ${report.healthScore}%
  </div>
</div>
  
  
</div>

      <hr />

      <div class="section">
  <h3>📈 Soil Health Trend</h3>

  <canvas id="chartCanvas" width="400" height="200"></canvas>
</div>

      <div style="display:flex; gap:10px; margin-top:20px;">
  
  <button onclick="window.print()">
    🖨️ Print Report
  </button>

  <button onclick="downloadPDF()">
    📄 Download PDF
  </button>

</div>
    </div>
  <script>
function downloadPDF() {
  const element = document.querySelector(".container");

  html2pdf()
    .from(element)
    .set({
      margin: 10,
      filename: "soil-report.pdf",
     html2canvas: { scale: 3 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .save();
}
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
const ctx = document.getElementById('chartCanvas');

new Chart(ctx, {
  type: 'line',
  data: {
    labels: ["Previous", "Current"],
    datasets: [{
      label: "Health Score",
      data: [${Math.max(report.healthScore - 10, 10)}, ${report.healthScore}],
      borderColor: "green",
      borderWidth: 2,
      fill: false,
      tension: 0.4
    }]
  },
  options: {
    plugins: {
      legend: { display: false }
    }
  }
});
</script>

</body>
</html>
  `;

  const newWindow = window.open("", "_blank");
  newWindow.document.write(reportHTML);
  newWindow.document.close();
};
  return (
  <div className={darkMode ? "chat-container dark" : "chat-container"}>
    <div className="header">

      <h1>🌱 Healthy Plant, Healthy Life</h1>
      <p style={{ fontSize: "14px", opacity: 0.7 }}>
  AI-based Soil Analysis & Smart Crop Recommendation System
</p>

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    
    {!user ? (
  <GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={() => console.log("Login Failed")}
/>
) : (
  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <span>👤 {user.name}</span>
    <button onClick={handleLogout}>Logout</button>
  </div>
)}

  <button onClick={toggleTheme}>
    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
  </button>
  </div>
</div>

    {/* INPUT CARD */}
    <motion.div
  style={{ display: "flex", flexDirection: "column", gap: "10px" }}
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <input
    type="number"
    placeholder="pH"
    value={ph}
    onChange={(e) => setPh(e.target.value)}
  />
  <input
    type="number"
    placeholder="Moisture (%) e.g. 40-70"
    value={moisture}
    onChange={(e) => setMoisture(e.target.value)}
  />
  <select value={crop} onChange={(e) => setCrop(e.target.value)}>
  <option value="">Select Crop</option>
  <option value="wheat">Wheat</option>
  <option value="rice">Rice</option>
  <option value="cotton">Cotton</option>
  <option value="jowar">Jowar</option>
</select>
  <button onClick={analyze}>Analyze Soil</button>

  <p style={{ fontSize: "12px", color: "var(--text)", opacity: 0.7, marginTop: "5px" }}>
    💡 Ideal moisture: 40–70%, Ideal pH: 6–7.5
  </p>

</motion.div>

    {/* HEALTH METER */}
<motion.div
  className="card"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <h2>🌡️ Soil Health</h2>

  {health === null ? (
    <p style={{ color: "var(--text)" }}>No analysis yet</p>
  ) : (
    <div className="health-bar">
      <div
        className="health-fill"
        style={{
          width: `${health}%`,
          transition: "width 0.6s ease",
          background:
            health < 40
              ? "red"
              : health < 70
              ? "orange"
              : "green"
        }}
      >
        {health}%
      </div>
    </div>
  )}
</motion.div>

{/* CHART CARD */}
<div className="card chart-container">
  <h2>📈 Soil Health Trend</h2>
  <Line data={chartData} options={chartOptions} />

  <p style={{ marginTop: "10px" }}>
  📊 Higher values indicate better soil conditions based on pH and moisture balance.
</p>
</div>

    {/* HISTORY CARD */}
    <motion.div
  className="card"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <h2>📊 Soil History</h2>


<button onClick={clearAllHistory}>Clear All</button>

      <div className="history-box">
        {history.length === 0 && (
  <p>No history yet. Analyze soil to see reports.</p>
)}
        {history.map((item, i) => (
  <div key={i} className="history-item">
    
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      
      <span>
 🌿 pH: {item.ph} | Moisture: {item.moisture}
{item.crop ? ` | 🌾 ${item.crop}` : ""} →
{item.soilType} | Health: {item.healthScore}%
</span>

      <div style={{ display: "flex", gap: "10px" }}>
  <button onClick={() => openWebReport(item)}>
  🌐 View Report
</button>

  <button onClick={() => deleteOne(item._id)} className="delete-btn">
    ❌
  </button>
</div>

    </div>

  </div>
))}
      </div>
    </motion.div>

    {selectedReport && (
  <div className="card">

    {/* HEADER */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h2>📄 Soil Analysis Report</h2>
      <button 
        onClick={() => setSelectedReport(null)} 
        style={{ background: "red", color: "white" }}
      >
        ✖
      </button>
    </div>

    <hr />

    {/* USER */}
    <p><strong>👤 User:</strong> {user?.name || "Guest"}</p>
    <p><strong>📅 Date:</strong> {new Date(selectedReport.date).toLocaleString()}</p>

    <hr />

    {/* PARAMETERS */}
    <h3>🌱 Soil Parameters</h3>
    <p>pH: {selectedReport.ph}</p>
    <p>Moisture: {selectedReport.moisture}%</p>
    <p>Soil Type: {selectedReport.soilType}</p>
    <p>Crop: {selectedReport.crop || "Not Selected"}</p>

    <hr />

    {/* HEALTH */}
    <h3>🌡️ Health Analysis</h3>
    <p>Score: {selectedReport.healthScore}%</p>

    <div className="health-bar">
      <div
        className="health-fill"
        style={{
          width: `${selectedReport.healthScore}%`,
          background:
            selectedReport.healthScore < 40
              ? "red"
              : selectedReport.healthScore < 70
              ? "orange"
              : "green"
        }}
      >
        {selectedReport.healthScore}%
      </div>
    </div>

    <hr />

    {/* DOWNLOAD BUTTON */}
    <button onClick={() => downloadPDF(selectedReport)}>
      📄 Download PDF
    </button>

  </div>
)}

    {/* CHAT CARD */}
    <motion.div
  className="card"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
      <button onClick={newChat}>🆕 New Chat</button>

      <div className="chat-box">
        {messages.map((msg, i) => (
  <motion.div
    key={i}
    className={msg.type === "user" ? "message-user" : "message-bot"}
    initial={{ opacity: 0, x: msg.type === "user" ? 50 : -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <span style={{ whiteSpace: "pre-line" }}>{msg.text}</span>
  </motion.div>
))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="Ask something..."
  style={{ flex: 1 }}
/>
        <button onClick={sendMessage}>Send</button>
      </div>

    </motion.div>

  </div>
);
}

export default App;