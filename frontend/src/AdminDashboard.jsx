import { useEffect, useState } from "react";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const complaintsResponse = await fetch(
        "http://127.0.0.1:8000/admin/complaints"
      );

      const complaintsData = await complaintsResponse.json();

      const workersResponse = await fetch(
        "http://127.0.0.1:8000/workers"
      );

      const workersData = await workersResponse.json();

      if (!complaintsResponse.ok) {
        throw new Error("Failed to load complaints");
      }

      if (!workersResponse.ok) {
        throw new Error("Failed to load workers");
      }

      setComplaints(complaintsData);
      setWorkers(workersData);

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==============================
  // ASSIGN WORKER
  // ==============================

  const assignWorker = async (
    complaintId,
    workerId
  ) => {
    if (!workerId) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/assign?complaint_id=${complaintId}&worker_id=${workerId}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Assignment failed"
        );
      }

      alert("Worker assigned successfully!");

      fetchData();

    } catch (error) {
      alert(error.message);
    }
  };

  // ==============================
  // VERIFY DISPOSAL
  // ==============================

  const verifyDisposal = async (
    complaintId,
    status
  ) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/verify/${complaintId}?status=${status}&remarks=${encodeURIComponent(
          status === "Verified"
            ? "Disposal verified by admin"
            : "Disposal rejected by admin"
        )}`,
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
        `Disposal ${status.toLowerCase()} successfully!`
      );

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.page}>

      <header style={styles.header}>
        <h1>Waste Management System</h1>
        <p>Admin Dashboard</p>
      </header>

      <div style={styles.container}>

        <div style={styles.stats}>

  <div style={styles.statCard}>
    <h3 style={styles.statTitle}>Total Complaints</h3>
<p style={styles.statNumber}>{complaints.length}</p>
  </div>

  <div style={styles.statCard}>
    <h3>Pending</h3>
    <p>
      {
        complaints.filter(
          (c) => c.status === "Pending"
        ).length
      }
    </p>
  </div>

  <div style={styles.statCard}>
    <h3>Assigned</h3>
    <p>
      {
        complaints.filter(
          (c) => c.status === "Assigned"
        ).length
      }
    </p>
  </div>

  <div style={styles.statCard}>
    <h3>Completed</h3>
    <p>
      {
        complaints.filter(
          (c) => c.status === "Completed"
        ).length
      }
    </p>
  </div>

</div>
  <div style={styles.topBar}>

          <div>
            <h2>Complaint Management</h2>
            <p>
              Monitor complaints, assign workers and verify disposal
            </p>
          </div>

          <button
            onClick={fetchData}
            style={styles.refreshButton}
          >
            Refresh
          </button>

        </div>

        {loading ? (

          <p>Loading...</p>

        ) : complaints.length === 0 ? (

          <div style={styles.empty}>
            <h3>No complaints found</h3>
            <p>
              New complaints will appear here.
            </p>
          </div>

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

                {complaints.map((complaint) => (

                  <tr key={complaint.complaint_id}>

                    <td style={styles.td}>
                      #{complaint.complaint_id}
                    </td>

                    <td style={styles.td}>
                      {complaint.waste_type}
                    </td>

                    <td style={styles.td}>
  <div>
    <strong>Lat:</strong> {complaint.latitude}
    <br />
    <strong>Long:</strong> {complaint.longitude}
  </div>

  <a
    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
    target="_blank"
    rel="noopener noreferrer"
    style={styles.mapLink}
  >
    📍 View on Map
  </a>
</td>

                    <td style={styles.td}>
                      <span style={styles.status}>
                        {complaint.status}
                      </span>
                    </td>

                    <td style={styles.td}>

                      <select
                        style={styles.select}
                        defaultValue=""
                        onChange={(e) =>
                          assignWorker(
                            complaint.complaint_id,
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select Worker
                        </option>

                        {workers.map((worker) => (

                          <option
                            key={worker.worker_id}
                            value={worker.worker_id}
                          >
                            {worker.name} -{" "}
                            {worker.availability}
                          </option>

                        ))}

                      </select>

                    </td>

                    <td style={styles.td}>

                      <div style={styles.verifyButtons}>

                        <button
                          style={styles.verifyButton}
                          onClick={() =>
                            verifyDisposal(
                              complaint.complaint_id,
                              "Verified"
                            )
                          }
                        >
                          Verify
                        </button>

                        <button
                          style={styles.rejectButton}
                          onClick={() =>
                            verifyDisposal(
                              complaint.complaint_id,
                              "Rejected"
                            )
                          }
                        >
                          Reject
                        </button>

                      </div>

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
 
    mapLink: {
  display: "inline-block",
  marginTop: "8px",
  color: "#2e7d32",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
},   
  stats: {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "15px",
  marginBottom: "25px",
},

statCard: {
  background: "white",
  padding: "18px",
  borderRadius: "10px",
  textAlign: "center",
  border: "1px solid #e1e5e2",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
},

statTitle: {
  margin: 0,
  fontSize: "14px",
  color: "#666",
},

statNumber: {
  margin: "8px 0 0",
  fontSize: "28px",
  color: "#2e7d32",
  fontWeight: "700",
},
  

  page: {
    minHeight: "100vh",
    background: "#f4f7f5",
  },

  header: {
    background: "#2e7d32",
    color: "white",
    padding: "25px",
    textAlign: "center",
  },

  container: {
    width: "1200px",
    maxWidth: "95%",
    margin: "30px auto",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.08)",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  refreshButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f1f5f2",
    borderBottom: "2px solid #ddd",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #eee",
  },

  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "15px",
    background: "#fff3cd",
    color: "#856404",
    fontSize: "13px",
  },

  select: {
    padding: "9px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    minWidth: "170px",
  },

  verifyButtons: {
    display: "flex",
    gap: "8px",
  },

  verifyButton: {
    padding: "8px 12px",
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
    background: "#777",
    color: "white",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "50px 20px",
    background: "#f8faf8",
    borderRadius: "8px",
  },
};

export default AdminDashboard;
