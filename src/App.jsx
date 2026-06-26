import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WineProvider } from "./components/WineContext";
import Catalog from "./pages/Catalog";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <WineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </WineProvider>
  );
}
