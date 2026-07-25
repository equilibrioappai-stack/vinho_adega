import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { WineProvider } from "./components/WineContext";
import Catalog from "./pages/Catalog";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function CatalogRoute() {
  const { supplierSlug } = useParams();
  return (
    <WineProvider supplierSlug={supplierSlug}>
      <Catalog />
    </WineProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/catalogo/:supplierSlug" element={<CatalogRoute />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
