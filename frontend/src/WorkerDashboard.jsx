import { useEffect, useState } from "react";

function WorkerDashboard({ workerId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState({});

  // ==============================
  // FETCH ASSIGNED COMPLAINTS
  // ==============================

  const fetchComplaints = async () => {
    try {
      const response = await fetch(
        `https://waste-management-system-1-samo.onrender.com/worker/${workerId}/complaints`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load complaints"
        );
      }

      setComplaints(data);

    } catch (error) {
      alert(error.message);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ==============================
  // UPDATE COMPLAINT STATUS
  // ==============================

  const updateStatus = async (
    complaintId,
    status
  ) => {
    try {
      const response = await fetch(
        `https://waste-management-system-1-samo.onrender.com/worker/complaint/${complaintId}/status?status=${status}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Status update failed"
        );
      }

      alert(
        `Complaint status updated to ${status}`
      );

      fetchComplaints();

    } catch (error) {
      alert(error.message);
    }
  };

  // ==============================
  // SUBMIT DISPOSAL
  // ==============================

  const submitDisposal = async (complaintId) => {
    const route = routes[complaintId];

    if (!route) {
      alert("Please select a disposal route");
      return;
    }

    try {
      const response = await fetch(
        `https://waste-management-system-1-samo.onrender.com/worker/disposal?complaint_id=${complaintId}&route=${route}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Disposal submission failed"
        );
      }

      alert(
        `Disposal submitted successfully!\nRoute: ${route}`
      );

    } catch (error) {
      alert(error.message);
    }
  };

  // ==============================
  // UI
  // ==============================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <h1>
          Waste Management System
        </h1>

        <p>
          Worker Dashboard
        </p>

      </header>

      {/* MAIN CONTAINER */}

      <div style={styles.container}>

        {/* TOP BAR */}

        <div style={styles.topBar}>

          <div>

            <h2>
              Assigned Complaints
            </h2>

            <p>
              View and update your assigned cleaning tasks
            </p>

          </div>

          <button
            onClick={fetchComplaints}
            style={styles.refreshButton}
          >
            Refresh
          </button>

        </div>

        {/* LOADING */}

        {loading ? (

          <p>
            Loading complaints...
          </p>

        ) : complaints.length === 0 ? (

          /* NO COMPLAINTS */

          <div style={styles.empty}>

            <h3>
              No assigned complaints
            </h3>

            <p>
              New tasks assigned by the admin
              will appear here.
            </p>

          </div>

        ) : (

          /* COMPLAINT CARDS */

          <div style={styles.cards}>

            {complaints.map((complaint) => (

              <div
                key={complaint.complaint_id}
                style={styles.card}
              >

                {/* CARD HEADER */}

                <div style={styles.cardHeader}>

                  <h3>
                    Complaint #{complaint.complaint_id}
                  </h3>

                  <span style={styles.status}>
                    {complaint.status}
                  </span>

                </div>

                {/* WASTE TYPE */}

                <p>
                  <strong>
                    Waste Type:
                  </strong>{" "}
                  {complaint.waste_type}
                </p>

                {/* LOCATION */}

                <p>
                  <strong>
                    Location:
                  </strong>
                  <br />

                  Latitude:{" "}
                  {complaint.latitude}

                  <br />

                  Longitude:{" "}
                  {complaint.longitude}
                </p>

                {/* DISPOSAL */}

                <div style={styles.disposalBox}>

                  <h4>
                    ♻️ Disposal Management
                  </h4>

                  <select
                    style={styles.select}
                    value={
                      routes[complaint.complaint_id]
                      || ""
                    }
                    onChange={(e) =>
                      setRoutes({
                        ...routes,
                        [complaint.complaint_id]:
                          e.target.value,
                      })
                    }
                  >

                    <option value="">
                      Select Disposal Route
                    </option>

                    <option value="Compost">
                      Compost
                    </option>

                    <option value="Biogas">
                      Biogas
                    </option>

                    <option value="MRF">
                      MRF
                    </option>

                    <option value="Recycler">
                      Recycler
                    </option>

                  </select>

                  <button
                    style={styles.disposalButton}
                    onClick={() =>
                      submitDisposal(
                        complaint.complaint_id
                      )
                    }
                  >
                    Submit Disposal
                  </button>

                </div>

                {/* STATUS BUTTONS */}

                <div style={styles.buttons}>

                  <button
                    style={styles.collectButton}
                    onClick={() =>
                      updateStatus(
                        complaint.complaint_id,
                        "Collected"
                      )
                    }
                    disabled={
                      complaint.status ===
                      "Completed"
                    }
                  >
                    Mark Collected
                  </button>

                  <button
                    style={styles.completeButton}
                    onClick={() =>
                      updateStatus(
                        complaint.complaint_id,
                        "Completed"
                      )
                    }
                    disabled={
                      complaint.status ===
                      "Completed"
                    }
                  >
                    Mark Completed
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}


// ==============================
// STYLES
// ==============================

const styles = {

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
    width: "900px",
    maxWidth: "92%",
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

  cards: {
    display: "grid",
    gap: "20px",
  },

  card: {
  border: "1px solid #e1e5e2",
  borderRadius: "10px",
  padding: "22px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
},

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  status: {
    padding: "6px 12px",
    borderRadius: "15px",
    background: "#fff3cd",
    color: "#856404",
    fontSize: "13px",
  },

  disposalBox: {
  marginTop: "20px",
  padding: "18px",
  background: "#f7faf7",
  border: "1px solid #e1e5e2",
  borderRadius: "8px",
},

  select: {
    padding: "9px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    minWidth: "200px",
  },

  disposalButton: {
    marginLeft: "10px",
    padding: "9px 15px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
    color: "white",
    cursor: "pointer",
  },

  buttons: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },

  collectButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#555",
    color: "white",
    cursor: "pointer",
  },

  completeButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#2e7d32",
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

export default WorkerDashboard;