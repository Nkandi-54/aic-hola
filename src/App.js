import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalAudioDock from "./components/GlobalAudioDock";
import MobileQuickDock from "./components/MobileQuickDock";
import { AudioProvider } from "./context/AudioContext";
import Home from "./pages/Home";
import History from "./pages/History";
import Choirs from "./pages/Choirs";
import Sermons from "./pages/Sermons";
import Live from "./pages/Live";
import Gallery from "./pages/Gallery";
import Contacts from "./pages/Contacts";
import Updates from "./pages/Updates";
import Calendar from "./pages/Calendar";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import ManageContent from "./pages/ManageContent";
import Treasury from "./pages/Treasury";
import Records from "./pages/Records";
import WorshipMedia from "./pages/WorshipMedia";
import PastorDesk from "./pages/PastorDesk";
import Workspace from "./pages/Workspace";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { useAuth } from "./lib/auth";
import "./App.css";

function RequireStaffAccess({ allow, children }) {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="page-shell">
        <p className="empty-state">Verifying your access…</p>
      </div>
    );
  }

  if (!auth.isAuthenticated || auth.isSuspended || !allow(auth)) {
    return (
      <div className="page-shell">
        <div className="panel gate-card">
          <span className="badge subtle">
            {!auth.isAuthenticated ? "Restricted" : "Not assigned"}
          </span>
          <h2 className="panel-title">
            {!auth.isAuthenticated
              ? "Staff sign-in required"
              : auth.isSuspended
                ? "Your account is suspended"
                : "You don’t have access here yet"}
          </h2>
          <p className="panel-sub">
            {!auth.isAuthenticated
              ? "Sign in with your church account to access this staff area."
              : auth.isSuspended
                ? "Please speak to the church administrator to restore staff access."
                : "Your account does not have permission to open this staff area."}
          </p>
          {!auth.isAuthenticated ? (
            <Link className="button" to="/account">
              Go to sign in
            </Link>
          ) : (
            <Link className="button ghost" to="/">
              Return home
            </Link>
          )}
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AudioProvider>
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <Navbar />

          <main className="content-wrap" id="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/choirs/*" element={<Choirs />} />
              <Route path="/sermons" element={<Sermons />} />
              <Route path="/live" element={<Live />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/calendar" element={<Calendar />} />

              <Route path="/account" element={<Account />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/admin" element={<RequireStaffAccess allow={(auth) => auth.isAdmin || auth.isPastor}><Admin /></RequireStaffAccess>} />
              <Route path="/admin/people" element={<RequireStaffAccess allow={(auth) => auth.isAdmin || auth.isPastor}><Admin initialTab="people" /></RequireStaffAccess>} />
              <Route path="/admin/departments" element={<RequireStaffAccess allow={(auth) => auth.isAdmin || auth.isPastor}><Admin initialTab="heads" /></RequireStaffAccess>} />
              <Route path="/admin/invitations" element={<RequireStaffAccess allow={(auth) => auth.isAdmin}><Admin initialTab="invite" /></RequireStaffAccess>} />
              <Route path="/workspace" element={<RequireStaffAccess allow={(auth) => auth.isStaff}><Workspace /></RequireStaffAccess>} />
              <Route path="/manage/events" element={<RequireStaffAccess allow={(auth) => auth.isStaff}><ManageContent /></RequireStaffAccess>} />
              <Route path="/treasury" element={<RequireStaffAccess allow={(auth) => auth.isTreasurer}><Treasury /></RequireStaffAccess>} />
              <Route path="/records" element={<RequireStaffAccess allow={(auth) => auth.isStaff}><Records /></RequireStaffAccess>} />
              <Route path="/media" element={<RequireStaffAccess allow={(auth) => auth.canManageMedia || auth.isAdmin || auth.isPastor}><WorshipMedia /></RequireStaffAccess>} />
              <Route path="/pastor-desk" element={<RequireStaffAccess allow={(auth) => auth.isPastor}><PastorDesk /></RequireStaffAccess>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
          <GlobalAudioDock />
          <MobileQuickDock />
        </div>
      </Router>
    </AudioProvider>
  );
}

export default App;