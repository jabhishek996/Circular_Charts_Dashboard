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
    if (!chartRef.current) return;
    const doc = new jsPDF({ orientation: "landscape" });
    const now = new Date();
    const timestamp = now.toLocaleString();

    doc.setFontSize(12);
    doc.text(`Report Generated At: ${timestamp}`, 14, 20);
    if (chartRef.current) {
      try {
        const chartImage = chartRef.current.toBase64Image();
        const pageWidth = doc.internal.pageSize.getWidth() - 28;
        const imgProps = doc.getImageProperties(chartImage);
        const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
        doc.addImage(chartImage, 'PNG', 14, 30, pageWidth, imgHeight);
      } catch (err) {
        console.error('Failed to add chart image to PDF', err);
      }
    }

    doc.save(`CircularChart_${timestamp}.pdf`);
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
    <div className="radar-chart-container">
      <div className="heading">
        <div className="logo"> <img src={MqLogo} alt="logo" /></div>
        <h2>Circular Chart</h2>

        <div className="select-input">

          {/* GROUP DROPDOWN */}
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedTrench("");
            }}
          >
            <option value="">Select Group</option>
            {trench_list.Trench_Selection.map((sel, i) => (
              <option key={i} value={sel}>{sel}</option>
            ))}
          </select>

          {/* TRENCH DROPDOWN */}
          <select
            value={selectedTrench}
            onChange={(e) => setSelectedTrench(e.target.value)}
          >
            <option value="">Select Trench</option>
            {selectedGroup &&
              trench_list[selectedGroup]?.map((trench, i) => (
                <option key={i} value={trench}>{trench}</option>
              ))}
          </select>

          {/* DATE INPUT */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* SUBMIT BUTTON */}
          <button
            onClick={loadChart}
            style={{
              backgroundColor: "#513cb1",
              border: "none",
              color: "white",
              padding: "10px 30px",
              borderRadius: "5px"
            }}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          {/* download button */}
          <button
            onClick={downloadPDF}
            style={{
              backgroundColor: "#2563eb",
              border: "none",
              color: "white",
              padding: "10px 30px",
              borderRadius: "5px",
              marginLeft: "5px"
            }}
          >
            Download PDF
          </button>
        </div>

        {date && <h2>Date: {date}</h2>}
      </div>

      <div className="radar-wrapper">
        <div className="radar-container">
          <div className="chart-section">
            {chartData ? (
              <Radar ref={chartRef} data={chartData} options={options} />
            ) : (
              <p>Select trench & date → click submit</p>
            )}
          </div>
        </div>

        <footer className="footer">
          © Multiquadrant Industrial Controls (I) Pvt. Ltd. 2025
        </footer>
      </div>
    </div>
  );
};

export default RadarChart;