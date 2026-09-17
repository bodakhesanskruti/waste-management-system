import { useEffect, useState } from "react";

const API = "https://waste-management-system-1-samo.onrender.com";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Fetch complaints
  // --------------------------------------------------

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/admin/complaints`
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
      alert("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };


  // --------------------------------------------------
  // Fetch workers
  // --------------------------------------------------

  const fetchWorkers = async () => {
    try {

      const response = await fetch(
        `${API}/workers`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load workers"
        );
      }

      setWorkers(data);

    } catch (error) {
      console.error(error);
      alert("Failed to load workers");
    }
  };


  // --------------------------------------------------
  // Load data when dashboard opens
  // --------------------------------------------------

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();
  }, []);


  // --------------------------------------------------
  // Assign worker
  // --------------------------------------------------

  const assignWorker = async (
    complaintId,
    workerId
  ) => {

    if (!workerId) {
      return;
    }

    try {

      const response = await fetch(
        `${API}/admin/assign?complaint_id=${complaintId}&worker_id=${workerId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to assign worker"
        );
      }

      alert("Worker assigned successfully!");

      fetchComplaints();
      fetchWorkers();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  // --------------------------------------------------
  // Verify / Reject disposal
  // --------------------------------------------------

  const verifyDisposal = async (
    complaintId,
    status
  ) => {

    try {

      const response = await fetch(
        `${API}/admin/verify/${complaintId}?status=${status}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Verification failed"
        );
      }

      alert(
        status === "Verified"
          ? "Disposal verified successfully!"
          : "Disposal rejected."
      );

      fetchComplaints();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };


  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const total = complaints.length;

  const pending = complaints.filter(
    (c) => c.status === "Pending"
  ).length;

  const assigned = complaints.filter(
    (c) => c.status === "Assigned"
  ).length;

  const completed = complaints.filter(
    (c) => c.status === "Completed"
  ).length;


  return (
    <div style={styles.page}>

      {/* Header */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            Waste Management System
          </h1>

          <p style={styles.subtitle}>
            Admin Dashboard
          </p>
        </div>

        <button
          onClick={() => {
            fetchComplaints();
            fetchWorkers();
          }}
          style={styles.refreshButton}
        >
          Refresh
        </button>

      </div>


      {/* Statistics */}

      <div style={styles.statsContainer}>

        <div style={styles.statCard}>
          <h2>Total Complaints</h2>
          <p>{total}</p>
        </div>

        <div style={styles.statCard}>
          <h2>Pending</h2>
          <p>{pending}</p>
        </div>

        <div style={styles.statCard}>
          <h2>Assigned</h2>
          <p>{assigned}</p>
        </div>

        <div style={styles.statCard}>
          <h2>Completed</h2>
          <p>{completed}</p>
        </div>

      </div>


      {/* Complaints */}

      <div style={styles.card}>

        <h2 style={styles.sectionTitle}>
          Complaints
        </h2>

        {loading ? (

          <p>Loading complaints...</p>

        ) : complaints.length === 0 ? (

          <p>No complaints found.</p>

        ) : (

          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    ID
                  </th>

                  <th style={styles.th}>
                    Waste Type
                  </th>

                  <th style={styles.th}>
                    Location
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Assign Worker
                  </th>

                  <th style={styles.th}>
                    Verification
                  </th>

                </tr>

              </thead>


              <tbody>

                {complaints.map((complaint) => {

                  return (

                    <tr key={complaint.complaint_id}>

                      {/* ID */}

                      <td style={styles.td}>
                        #{complaint.complaint_id}
                      </td>


                      {/* Waste */}

                      <td style={styles.td}>

                        {complaint.waste_type}

                      </td>


                      {/* Location */}

                      <td style={styles.td}>

                        <div>
                          Lat:{" "}
                          {complaint.latitude}
                        </div>

                        <div>
                          Long:{" "}
                          {complaint.longitude}
                        </div>

                        <a
                          href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.mapLink}
                        >
                          📍 View on Map
                        </a>

                      </td>


                      {/* Status */}

                      <td style={styles.td}>

                        <span
                          style={{
                            ...styles.status,
                            background:
                              complaint.status ===
                              "Completed"
                                ? "#d8f3dc"
                                : complaint.status ===
                                  "Assigned"
                                ? "#fff3cd"
                                : "#eeeeee",
                          }}
                        >
                          {complaint.status}
                        </span>

                      </td>


                      {/* Assign Worker */}

                      <td style={styles.td}>

                        <select
                          defaultValue=""
                          onChange={(e) =>
                            assignWorker(
                              complaint.complaint_id,
                              e.target.value
                            )
                          }
                          style={styles.select}
                        >

                          <option value="">
                            Select Worker
                          </option>

                          {workers.map(
                            (worker) => (

                              <option
                                key={
                                  worker.worker_id
                                }
                                value={
                                  worker.worker_id
                                }
                              >
                                {worker.name} -{" "}
                                {
                                  worker.availability
                                }
                              </option>

                            )
                          )}

                        </select>

                      </td>


                      {/* Verification */}

                      <td style={styles.td}>

                        {complaint.verification_status ===
                        "Pending" ? (

                          <div>

                            <button
                              onClick={() =>
                                verifyDisposal(
                                  complaint.complaint_id,
                                  "Verified"
                                )
                              }
                              style={
                                styles.verifyButton
                              }
                            >
                              Verify
                            </button>

                            <button
                              onClick={() =>
                                verifyDisposal(
                                  complaint.complaint_id,
                                  "Rejected"
                                )
                              }
                              style={
                                styles.rejectButton
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : (

                          <span
                            style={
                              styles.verificationText
                            }
                          >
                            {
                              complaint.verification_status ||
                              "Not Submitted"
                            }
                          </span>

                        )}

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


// --------------------------------------------------
// Styles
// --------------------------------------------------

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f4f7f5",
    padding: "30px",
    boxSizing: "border-box",
  },

  header: {
    background: "#ffffff",
    padding: "22px 28px",
    borderRadius: "12px",
    marginBottom: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
  },

  title: {
    margin: 0,
    color: "#2e7d32",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#666",
  },

  refreshButton: {
    padding: "11px 20px",
    border: "none",
    borderRadius: "7px",
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
  },

  statsContainer: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "25px",
  },

  statCard: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#333",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "15px",
    textAlign: "left",
    background: "#f0f3f1",
    borderBottom:
      "1px solid #ddd",
  },

  td: {
    padding: "15px",
    borderBottom:
      "1px solid #eee",
    verticalAlign: "top",
  },

  mapLink: {
    display: "inline-block",
    marginTop: "8px",
    color: "#2e7d32",
    textDecoration: "none",
  },

  status: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
  },

  select: {
    padding: "9px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    minWidth: "170px",
  },

  verifyButton: {
    padding: "8px 12px",
    marginRight: "7px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
  },

  rejectButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#555",
    color: "white",
    cursor: "pointer",
  },

  verificationText: {
    padding: "7px 10px",
    borderRadius: "6px",
    background: "#eeeeee",
    color: "#555",
  },
};

export default AdminDashboard;