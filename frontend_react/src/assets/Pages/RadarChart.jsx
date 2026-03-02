"use client";
import React, { useState, useRef } from "react";
import { Radar } from "react-chartjs-2";
import { trench_list } from "../../data/Trench_list";
import MqLogo from '../../assets/Logo_Multiquadrant.jpg'
// pdf export libs
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

import "./RadarChart.css";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = () => {
  const [chartData, setChartData] = useState(null);
  const [date, setDate] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTrench, setSelectedTrench] = useState("");
  const [loading, setLoading] = useState(false);

  const chartRef = useRef(null); // ref to chart for export

 const downloadPDF = () => {
  if (!chartRef.current) {
    console.warn("Chart not ready for export");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape" });
  const now = new Date();
  const fileStamp = now.toISOString().replace(/[:.]/g, "-");

  // === Header on same line ===
  doc.setFontSize(10);

  const startX = 14;
  const y = 20;

  const text1 = `Report Generated At: ${now.toLocaleString()}`;
  const text2 = `Press No: ${selectedTrench || "-"}`;
  const text3 = `Report for Date: ${date || "-"}`;

  const width1 = doc.getTextWidth(text1);
  const width2 = doc.getTextWidth(text2);

  doc.text(text1, startX, y);
  doc.text(text2, startX + width1 + 20, y);      // 10px spacing
  doc.text(text3, startX + width1 + width2 + 40, y);

  // === Horizontal line ===
  const lineY = y + 4; // a bit below text
  doc.setLineWidth(0.5);
  doc.line(startX, lineY, doc.internal.pageSize.getWidth() - 14, lineY);

  // === Chart Image ===
  let chartImage = null;
  try {
    const ref = chartRef.current;
    if (ref && typeof ref.toBase64Image === "function") {
      chartImage = ref.toBase64Image();
    } else if (ref && ref.chart && typeof ref.chart.toBase64Image === "function") {
      chartImage = ref.chart.toBase64Image();
    } else if (ref && ref.chartInstance && typeof ref.chartInstance.toBase64Image === "function") {
      chartImage = ref.chartInstance.toBase64Image();
    }
  } catch (err) {
    console.error("Error obtaining chart image:", err);
  }

  if (chartImage) {
    try {
      const pageWidth = doc.internal.pageSize.getWidth() - 28;
      const imgProps = doc.getImageProperties(chartImage);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      doc.addImage(chartImage, "PNG", 14, lineY + 8, pageWidth, imgHeight);
    } catch (err) {
      console.error("Failed to add chart image to PDF", err);
      doc.text("Chart image could not be added.", 14, lineY + 8);
    }
  } else {
    doc.text("Chart image not available", 14, lineY + 8);
  }

  doc.save(`CircularChart_${fileStamp}.pdf`);
};

  // 🔥 API CALL FUNCTION
  const loadChart = async () => {
    if (!selectedTrench || !date) {
      alert("Please select trench and date");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/get/circularchart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          press: selectedTrench,
          date: date
        })
      });

      const result = await res.json();
      const data = result.data;

      setChartData({
        labels: data.created_at,
        datasets: [
          {
            label: "Temperature 1",
            data: data.temp_1,
            backgroundColor: "rgba(59,130,246,0.2)",
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            pointRadius: 2,
            fill: false
          },
          {
            label: "Temperature 2",
            data: data.temp_2,
            backgroundColor: "rgba(34,197,94,0.2)",
            borderColor: "rgba(34,197,94,1)",
            borderWidth: 2,
            pointRadius: 2,
            fill: false
          },
          {
            label: "Temperature 3",
            data: data.temp_3,
            backgroundColor: "rgba(239,68,68,0.2)",
            borderColor: "rgba(239,68,68,1)",
            borderWidth: 2,
            pointRadius: 2,
            fill: false
          }
        ]
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
          min: 50,     // lowest value shown on the chart
      max: 180, 
        grid: { circular: true, color: "#94a3b8" },
        angleLines: { display: false },
        ticks: { stepSize: 10, backdropColor: "transparent", color: "#000" },
        pointLabels: { color: "#000", font: { size: 0 } }
      }
    },
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Time : 24 Hour - 15 Min",
        color: "#1e40af",
        font: { size: 16 }
      }
    }
  };



return (
  <div className="dashboard">

    {/* LEFT SIDEBAR */}
    <aside className="sidebar">
      <div className="brand">
        <img src={MqLogo} alt="logo" />
        {/* <div>
          <h3>multiquadrant ind.</h3>
          <p>controls (i) pvt. ltd.</p>
        </div> */}
      </div>

      <h2 className="page-title">CIRCULAR CHART<br />DASHBOARD</h2>

      <div className="card">
        <h4>PARAMETER SETTINGS</h4>

        <label>Select Trench</label>
        <select
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setSelectedTrench("");
          }}
        >
          <option value="">Select Trench</option>
          {trench_list.Trench_Selection.map((sel, i) => (
            <option key={i} value={sel}>{sel}</option>
          ))}
        </select>

        <label>Select Machine</label>
        <select
          value={selectedTrench}
          onChange={(e) => setSelectedTrench(e.target.value)}
        >
          <option value="">Select Machine</option>
          {selectedGroup &&
            trench_list[selectedGroup]?.map((trench, i) => (
              <option key={i} value={trench}>{trench}</option>
            ))}
        </select>

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="primary-btn" onClick={loadChart}>
          {loading ? "Loading..." : "Submit"}
        </button>

        <button className="secondary-btn" onClick={downloadPDF}>
          Download Report
        </button>
      </div>

      <div className="summary card">
        <h4>REPORT SUMMARY</h4>
        <p className="date">Date: {date || "-"}</p>
        <p className="info">
          Data for: {selectedTrench || "Single Trench"}
        </p>
      </div>
    </aside>

    {/* RIGHT MAIN AREA */}
    <main className="main-area">
      <div className="chart-card">
        {chartData ? (
          <Radar ref={chartRef} data={chartData} options={options} />
        ) : (
          <p className="placeholder">
            Select trench & date → click submit
          </p>
        )}
      </div>

      <footer>
        © Multiquadrant Industrial Controls (I) Pvt. Ltd. 2025
      </footer>
    </main>

  </div>
);
};

export default RadarChart;