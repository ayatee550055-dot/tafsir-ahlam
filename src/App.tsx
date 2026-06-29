import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import SymbolsDictionary from "./pages/SymbolsDictionary";
import SymbolDetail from "./pages/SymbolDetail";
import LegalPage from "./pages/LegalPage";
import { HelmetProvider } from "react-helmet-async";

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/symbols" element={<SymbolsDictionary />} />
            <Route path="/symbol/:slug" element={<SymbolDetail />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/about" element={<LegalPage type="about" />} />
            <Route path="/contact" element={<LegalPage type="contact" />} />
            <Route path="/cookies" element={<LegalPage type="cookies" />} />
            <Route path="/disclaimer" element={<LegalPage type="disclaimer" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </HelmetProvider>
  );
}
