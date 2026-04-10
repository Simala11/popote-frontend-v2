import React, { useState, useCallback, useEffect } from 'react';
import './index.css';

import Nav from './components/Nav';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Toast from './components/Toast';

import HomePage from './pages/HomePage';
import SalePage from './pages/SalePage';
import OffPlanPage from './pages/OffPlanPage';
import RentalsPage from './pages/RentalsPage';
import DetailPage from './pages/DetailPage';
import ListWithUsPage from './pages/ListWithUsPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';

import { listingsAPI, enquiriesAPI } from './api';

export const AppContext = React.createContext(null);

const WA_NUMBER = '254739101811';

function App() {
  const [page, setPage] = useState('home');
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [toast, setToast] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailSource, setDetailSource] = useState('sale');
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  const showToast = useCallback((msg, isError = false) => {
    setToast({ msg, isError, id: Date.now() });
  }, []);

  const showPage = useCallback((p, extra = {}) => {
    if (p === 'detail' && extra.id) {
      setDetailId(extra.id);
      setDetailSource(extra.source || 'sale');
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setLoading(true);
    listingsAPI.getAll()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.results ?? []);
        setListings(arr);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    enquiriesAPI.getAll(adminToken)
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.results ?? []);
        setEnquiries(arr);
      })
      .catch(() => { });
  }, [adminToken]);

  const addEnquiry = useCallback(async (enq) => {
    const local = {
      ...enq,
      id: Date.now(),
      status: 'New',
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      }),
    };
    try {
      const saved = await enquiriesAPI.submit(enq);
      setEnquiries(prev => [...prev, { ...local, ...saved }]);
    } catch {
      setEnquiries(prev => [...prev, local]);
    }
  }, []);

  const ctx = {
    page, showPage,
    listings, setListings,
    enquiries, setEnquiries, addEnquiry,
    showToast,
    detailId, detailSource,
    WA_NUMBER,
    adminToken, setAdminToken,
    loading,
  };

  const pages = {
    home: <HomePage />,
    sale: <SalePage />,
    offplan: <OffPlanPage />,
    rentals: <RentalsPage />,
    detail: <DetailPage />,
    listwithus: <ListWithUsPage />,
    contact: <ContactPage />,
    admin: <AdminPage />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <Nav />
      <main key={page} className="page-enter">
        {pages[page] || pages.home}
      </main>
      <FloatingWhatsApp />
      {toast && <Toast key={toast.id} msg={toast.msg} isError={toast.isError} />}
    </AppContext.Provider>
  );
}

export default App;