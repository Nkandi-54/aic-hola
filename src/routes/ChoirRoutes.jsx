import { Routes, Route } from "react-router-dom";
import Choirs from "../pages/Choirs";
import ChoirDetail from "../pages/ChoirDetail";

const ChoirRoutes = () => {
  return (
    <Routes>
      <Route path="/choirs" element={<Choirs />} />
      <Route path="/choirs/:slug" element={<ChoirDetail />} />
    </Routes>
  );
};

export default ChoirRoutes;