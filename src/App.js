import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import Workspace from "./pages/Workspace";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
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

            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/people" element={<Admin initialTab="people" />} />
            <Route path="/admin/departments" element={<Admin initialTab="heads" />} />
            <Route path="/admin/invitations" element={<Admin initialTab="invite" />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/manage/events" element={<ManageContent />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/records" element={<Records />} />
            <Route path="/media" element={<WorshipMedia />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;