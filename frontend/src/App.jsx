import { useState } from "react";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import WorkerDashboard from "./WorkerDashboard";
import UserDashboard from "./UserDashboard";

function App() {
  const [user, setUser] = useState(null);

  const logout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div>
      <div
        style={{
          padding: "12px 20px",
          background: "#eeeeee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>
          Welcome, {user.name}
        </strong>

        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#555",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {user.role === "admin" && <AdminDashboard />}

      {user.role === "worker" && (
        <WorkerDashboard workerId={user.worker_id} />
      )}

      {user.role === "user" && (
  <UserDashboard userId={user.user_id} />
)}
    </div>
  );
}

export default App;