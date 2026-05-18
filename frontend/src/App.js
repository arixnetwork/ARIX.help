import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Workspace from "./pages/Workspace";
import Templates from "./pages/Templates";
import Deployments from "./pages/Deployments";
import Billing from "./pages/Billing";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import "./App.css";

function AppRouter() {
  const location = useLocation();
  // Synchronous check (must run before route matching) for OAuth return.
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<Workspace />} />
        <Route path="templates" element={<Templates />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="billing" element={<Billing />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#121212", border: "1px solid rgba(255,255,255,0.1)", color: "#fafafa" } }} />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
