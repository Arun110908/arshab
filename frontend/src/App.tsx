import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import Topic from "./pages/Topic";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/topic/:id" element={<Topic />} />
        <Route path="/lesson/:id" element={<Lesson />} />
      </Route>
      <Route path="*" element={<p className="p-8">Page not found</p>} />
    </Routes>
  );
}
