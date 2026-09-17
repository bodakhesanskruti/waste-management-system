import { useState, useEffect } from "react";

function UserDashboard({ userId }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);

  // Get user's complaints
  const fetchComplaints = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/user/${userId}/complaints`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load complaints"
        );
      }

      setComplaints(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [userId]);

  // Get GPS location
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        alert("Location detected successfully!");
      },
      (error) => {
        console.error(error);
        alert("Unable to get your location. Please allow location access.");
      }
    );
  };

  // Classify waste
  const classifyWaste = async () => {
    if (!image) {
      alert("Please select a waste image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", image);

      const response = await fetch(
        "http://127.0.0.1:8000/classify",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Classification failed"
        );
      }

      setResult(data.waste_type);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit complaint
  const submitComplaint = async () => {
    if (!image) {
      alert("Please select a waste image");
      return;
    }

    if (!result) {
      alert("Please classify the waste first");
      return;
    }

    if (!latitude || !longitude) {
      alert("Please get your location first");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/complaints?user_id=${userId}&latitude=${latitude}&longitude=${longitude}&waste_type=${encodeURIComponent(
          result
        )}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Complaint submission failed"
        );
      }

      alert(
        `Complaint submitted successfully!\nComplaint ID: ${data.complaint_id}`
      );

      // Refresh complaint history
      await fetchComplaints();

      // Clear form
      setImage(null);
      setResult("");
      setLatitude("");
      setLongitude("");

      // Reset file input visually
      document.querySelector('input[type="file"]').value = "";
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <h1>Waste Management System</h1>
        <p>User Dashboard</p>
      </header>

      {/* Report Waste */}
      <div style={styles.container}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>Report Waste</h2>

          <span style={styles.badge}>
            Citizen Portal
          </span>
        </div>

        <p style={styles.info}>
          Upload a waste image, classify it and report
          the location.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImage(e.target.files[0]);
            setResult("");
          }}
        />

        {/* AI Classification */}
        <div style={styles.section}>
          <button
            onClick={classifyWaste}
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Classify Waste"}
          </button>

          {result && (
            <div style={styles.result}>
              <strong>Waste Category:</strong>
              <br />
              {result}
            </div>
          )}
        </div>

        {/* GPS */}
        <div style={styles.section}>
          <button
            onClick={getLocation}
            style={styles.locationButton}
          >
            📍 Get My Location
          </button>

          {latitude && longitude && (
            <p style={styles.location}>
              Latitude: {latitude}
              <br />
              Longitude: {longitude}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={submitComplaint}
          style={styles.submitButton}
        >
          Submit Complaint
        </button>
      </div>

      {/* Complaint History */}
      <div style={styles.historyContainer}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>
            My Complaints
          </h2>

          <button
            onClick={fetchComplaints}
            style={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>

        {complaints.length === 0 ? (
          <p style={styles.empty}>
            No complaints submitted yet.
          </p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Waste Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>

              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.complaint_id}>
                    <td style={styles.td}>
                      #{complaint.complaint_id}
                    </td>

                    <td style={styles.td}>
                      {complaint.waste_type}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          background:
                            complaint.status === "Completed"
                              ? "#e8f5e9"
                              : complaint.status === "Assigned"
                              ? "#fff3cd"
                              : "#eeeeee",
                          color:
                            complaint.status === "Completed"
                              ? "#2e7d32"
                              : complaint.status === "Assigned"
                              ? "#856404"
                              : "#555",
                        }}
                      >
                        {complaint.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <a
                        href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.mapLink}
                      >
                        📍 View Map
                      </a>
                    </td>

                    <td style={styles.td}>
                      {complaint.created_at
                        ? new Date(
                            complaint.created_at
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7f5",
    paddingBottom: "40px",
  },

  header: {
    background: "#2e7d32",
    color: "white",
    padding: "25px",
    textAlign: "center",
  },

  container: {
    width: "600px",
    maxWidth: "90%",
    margin: "35px auto",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },

  historyContainer: {
    width: "1100px",
    maxWidth: "92%",
    margin: "30px auto",
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  badge: {
    padding: "6px 12px",
    borderRadius: "20px",
    background: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "13px",
    fontWeight: "600",
  },

  info: {
    color: "#666",
    marginBottom: "25px",
  },

  section: {
    marginTop: "25px",
  },

  primaryButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
  },

  locationButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "6px",
    background: "#555",
    color: "white",
    cursor: "pointer",
  },

  submitButton: {
    width: "100%",
    marginTop: "30px",
    padding: "13px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },

  refreshButton: {
    padding: "8px 14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "white",
    cursor: "pointer",
  },

  result: {
    marginTop: "15px",
    padding: "15px",
    background: "#f1f5f2",
    borderRadius: "8px",
  },

  location: {
    marginTop: "12px",
    color: "#555",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f4f7f5",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
  },

  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "600",
  },

  mapLink: {
    color: "#2e7d32",
    textDecoration: "none",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    color: "#777",
    padding: "30px",
  },
};

export default UserDashboard;
