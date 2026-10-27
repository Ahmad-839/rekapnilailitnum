import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// --- KOMPONEN IKON SVG (Anti-Hilang, tanpa perlu install library luar) ---
const IconLock = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const IconUnlock = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);
const IconEdit = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
const IconSave = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
const IconX = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const IconPrinter = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);
const IconRotateCcw = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="1 4 1 10 7 10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: 'AIzaSyDxgpwdO6f1AowEvolkSixXsLfQE_JEXqs',
  authDomain: 'litnum-fest-live.firebaseapp.com',
  projectId: 'litnum-fest-live',
  storageBucket: 'litnum-fest-live.firebasestorage.app',
  messagingSenderId: '977888302502',
  appId: '1:977888302502:web:2efec251cf5860d428ab67',
  measurementId: 'G-F6554PPTWY',
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const MAX_SCORES = { sq: 250, mm: 250, dc: 300 };
const ADMIN_PIN = '123456';

// Inline SVG Vector Logos
const LOGO_KIRI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='100%' height='100%' rx='20' fill='%230756B8'/><text x='50%' y='50%' fill='%23FFFFFF' font-weight='900' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>SMK 45</text></svg>";
const LOGO_KANAN =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='100%' height='100%' rx='20' fill='%23FFC928'/><text x='50%' y='50%' fill='%23071A35' font-weight='900' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>LITNUM</text></svg>";

const initialGroupsData = Array.from({ length: 14 }, (_, i) => ({
  id: `group-${(i + 1).toString().padStart(2, '0')}`,
  name: `Kelompok ${(i + 1).toString().padStart(2, '0')}`,
  sq: null,
  mm: null,
  dc: null,
  jp: null,
  tb: null,
}));

export default function LitnumFestApp() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState(initialGroupsData);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Firebase Auth (Anonymous)
  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch((err) => console.error('Auth error:', err));
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Timer Jam Digital
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fail-safe Loading Timeout
  // Firestore Real-time Listener & Data Sync
  useEffect(() => {
    // 1. Coba muat dari LocalStorage terlebih dahulu sebagai cadangan awal
    const localData = localStorage.getItem('litnum_groups_data');
    if (localData) {
      try {
        setGroups(JSON.parse(localData));
      } catch (e) {
        console.error('Gagal membaca local storage:', e);
      }
    }

    if (!db) {
      setLoading(false);
      return;
    }

    // 2. Hubungkan ke Firestore Koleksi Terpusat 'litnum_groups' (Bisa diakses bersama oleh semua akun)
    const groupsRef = collection(db, 'litnum_groups');
    const unsubscribe = onSnapshot(
      groupsRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Jika database Firebase masih kosong, inisialisasi data awal 14 kelompok secara massal
          try {
            const batch = writeBatch(db);
            initialGroupsData.forEach((g) => {
              batch.set(doc(groupsRef, g.id), g);
            });
            await batch.commit();
          } catch (e) {
            console.error('Gagal menginisialisasi Firestore:', e);
          }
        } else {
          const fetchedGroups = snapshot.docs.map((doc) => doc.data());
          setGroups(fetchedGroups);
          // Simpan juga ke localStorage sebagai cadangan offline
          localStorage.setItem(
            'litnum_groups_data',
            JSON.stringify(fetchedGroups)
          );
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Firestore Listener Error / Mode Offline:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const calculateTotal = (g) => {
    const sq = Number(g.sq || 0);
    const mm = Number(g.mm || 0);
    const dc = Number(g.dc || 0);
    const jp = Number(g.jp || 0);
    return sq + mm + dc + jp;
  };

  const isComplete = (g) =>
    g.sq !== null &&
    g.sq !== undefined &&
    g.mm !== null &&
    g.mm !== undefined &&
    g.dc !== null &&
    g.dc !== undefined;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const totalA = calculateTotal(a);
      const totalB = calculateTotal(b);
      if (totalB !== totalA) return totalB - totalA;
      if ((b.dc || 0) !== (a.dc || 0)) return (b.dc || 0) - (a.dc || 0);
      if ((b.mm || 0) !== (a.mm || 0)) return (b.mm || 0) - (a.mm || 0);
      if ((b.sq || 0) !== (a.sq || 0)) return (b.sq || 0) - (a.sq || 0);
      if ((b.jp || 0) !== (a.jp || 0)) return (b.jp || 0) - (a.jp || 0);
      return (b.tb || 0) - (a.tb || 0);
    });
  }, [groups]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setIsDrawerOpen(true);
    } else {
      setErrorMsg('PIN Salah!');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    if (
      editForm.sq !== null &&
      editForm.sq !== '' &&
      (editForm.sq < 0 || editForm.sq > MAX_SCORES.sq)
    ) {
      alert(`Nilai Smart Quiz harus 0 - ${MAX_SCORES.sq}`);
      return;
    }
    if (
      editForm.mm !== null &&
      editForm.mm !== '' &&
      (editForm.mm < 0 || editForm.mm > MAX_SCORES.mm)
    ) {
      alert(`Nilai Mystery Mission harus 0 - ${MAX_SCORES.mm}`);
      return;
    }
    if (
      editForm.dc !== null &&
      editForm.dc !== '' &&
      (editForm.dc < 0 || editForm.dc > MAX_SCORES.dc)
    ) {
      alert(`Nilai Data Challenge harus 0 - ${MAX_SCORES.dc}`);
      return;
    }

    const cleanData = {
      id: editForm.id,
      name: editForm.name || `Kelompok ${editForm.id.split('-')[1]}`,
      sq:
        editForm.sq === '' || editForm.sq === null ? null : Number(editForm.sq),
      mm:
        editForm.mm === '' || editForm.mm === null ? null : Number(editForm.mm),
      dc:
        editForm.dc === '' || editForm.dc === null ? null : Number(editForm.dc),
      jp:
        editForm.jp === '' || editForm.jp === null ? null : Number(editForm.jp),
      tb:
        editForm.tb === '' || editForm.tb === null ? null : Number(editForm.tb),
    };

    // Update state lokal
    const updatedGroups = groups.map((g) =>
      g.id === cleanData.id ? cleanData : g
    );
    setGroups(updatedGroups);
    localStorage.setItem('litnum_groups_data', JSON.stringify(updatedGroups));

    setEditingGroupId(null);
    setEditForm(null);

    // Sync ke Firestore publik
    if (db) {
      try {
        await updateDoc(doc(db, 'litnum_groups', editForm.id), cleanData);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('AWAS! Yakin ingin mereset SEMUA nilai ke awal?')) {
      const resetData = groups.map((g) => ({
        ...g,
        sq: null,
        mm: null,
        dc: null,
        jp: null,
        tb: null,
      }));
      setGroups(resetData);
      localStorage.setItem('litnum_groups_data', JSON.stringify(resetData));

      if (db) {
        try {
          const batch = writeBatch(db);
          groups.forEach((g) => {
            batch.update(doc(db, 'litnum_groups', g.id), {
              sq: null,
              mm: null,
              dc: null,
              jp: null,
              tb: null,
            });
          });
          await batch.commit();
        } catch (err) {
          console.warn('Firestore reset error:', err);
        }
      }
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#040d1a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFC928',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          className="spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 201, 40, 0.3)',
            borderTop: '4px solid #FFC928',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        ></div>
        <h2 style={{ letterSpacing: '2px' }}>MEMUAT SISTEM...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="litnum-root">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        body, .litnum-root { background-color: #040d1a; color: #f1f5f9; min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
        
        /* HEADER */
        .header { background: linear-gradient(135deg, #073b82 0%, #0756B8 100%); border-bottom: 4px solid #FFC928; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.5); z-index: 10; position: relative; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .logo-img { height: 50px; width: 50px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.1); }
        .header-title { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); line-height: 1.2; }
        .header-sub { font-size: 13px; color: #bae6fd; font-weight: 500; }
        .live-badge { display: inline-block; background: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; color: #4ade80; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 1px; animation: pulse 2s infinite; }
        
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); } 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); } }

        /* MAIN CONTENT & TABLE */
        .main-container { flex: 1; padding: 24px; max-width: 1280px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; }
        .table-card { background: rgba(11, 23, 44, 0.8); border: 1px solid rgba(7, 86, 184, 0.5); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); overflow: hidden; backdrop-filter: blur(10px); display: flex; flex-direction: column; }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        
        .score-table { width: 100%; border-collapse: collapse; text-align: center; min-width: 800px; }
        .score-table th { background: rgba(7, 86, 184, 0.4); color: #FFC928; padding: 18px 16px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #FFC928; white-space: nowrap; }
        .score-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 16px; transition: background 0.2s; }
        .score-table tr:hover td { background: rgba(22, 139, 255, 0.1); }
        .score-table tr:last-child td { border-bottom: none; }

        /* RANKING STYLES */
        .rank-circle { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 15px; }
        .rank-1 { background: linear-gradient(135deg, #FDE047 0%, #EAB308 100%); color: #422006; font-size: 20px; box-shadow: 0 0 15px rgba(234, 179, 8, 0.5); }
        .rank-2 { background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%); color: #0f172a; font-size: 18px; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); }
        .rank-3 { background: linear-gradient(135deg, #fed7aa 0%, #f97316 100%); color: #431407; font-size: 18px; box-shadow: 0 0 15px rgba(249, 115, 22, 0.3); }

        .group-name { font-weight: 700; font-size: 16px; color: #f8fafc; display: flex; align-items: center; gap: 8px; }
        .badge-warning { background: rgba(248, 113, 113, 0.15); border: 1px solid rgba(248, 113, 113, 0.4); color: #fca5a5; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; }
        .badge-tb { background: rgba(192, 132, 252, 0.15); border: 1px solid rgba(192, 132, 252, 0.4); color: #d8b4fe; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
        
        .score-cell { font-family: 'Courier New', Courier, monospace; font-weight: 600; font-size: 18px; color: #cbd5e1; }
        .score-jp { color: #fde047; font-weight: 700; background: rgba(253, 224, 71, 0.1); border-radius: 6px; padding: 4px 8px; display: inline-block; min-width: 40px; }
        .total-cell { font-weight: 900; font-size: 24px; color: #ffffff; background: rgba(7, 86, 184, 0.2); border-left: 1px solid rgba(7, 86, 184, 0.4); border-right: 1px solid rgba(7, 86, 184, 0.4); }

        /* FOOTER */
        .footer { padding: 16px 24px; font-size: 13px; color: #64748b; display: flex; justify-content: space-between; align-items: center; max-width: 1280px; margin: 0 auto; width: 100%; border-top: 1px solid rgba(255,255,255,0.05); }
        .btn-icon { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; cursor: pointer; padding: 10px; border-radius: 50%; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-icon:hover { background: rgba(255, 201, 40, 0.1); color: #FFC928; border-color: #FFC928; transform: scale(1.05); }

        /* MODAL LOGIN */
        .modal-overlay { position: fixed; inset: 0; background: rgba(4, 13, 26, 0.9); display: flex; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(8px); padding: 16px; }
        .modal-card { background: #0b172c; border: 2px solid #0756B8; border-radius: 20px; padding: 32px; width: 100%; max-width: 380px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); text-align: center; }
        .pin-input { width: 100%; background: #040d1a; border: 2px solid #1e293b; border-radius: 12px; padding: 16px; color: #fff; text-align: center; font-size: 32px; letter-spacing: 12px; font-weight: 700; margin: 24px 0; outline: none; transition: all 0.2s; }
        .pin-input:focus { border-color: #FFC928; box-shadow: 0 0 0 4px rgba(255, 201, 40, 0.1); }

        /* DRAWER ADMIN */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 90; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .drawer-overlay.open { opacity: 1; pointer-events: auto; }
        
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 480px; background: #0b172c; border-left: 2px solid #0756B8; z-index: 100; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: -20px 0 50px rgba(0,0,0,0.7); }
        .drawer.open { transform: translateX(0); }
        
        .drawer-header { background: #0756B8; padding: 20px 24px; border-bottom: 4px solid #FFC928; display: flex; justify-content: space-between; align-items: center; color: white; font-size: 18px; font-weight: 800; }
        .drawer-content { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

        .group-edit-card { background: #040d1a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; transition: border-color 0.2s; }
        .group-edit-card:hover { border-color: #3b82f6; }
        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .input-group { display: flex; flex-direction: column; gap: 4px; }
        .input-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-field { background: #0b172c; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 14px; font-weight: 600; outline: none; transition: border-color 0.2s; }
        .input-field:focus { border-color: #3b82f6; }
        
        /* BUTTONS */
        .btn { padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .btn:active { transform: translateY(2px); }
        .btn-primary { background: #0756B8; color: white; }
        .btn-primary:hover { background: #2563eb; }
        .btn-success { background: #16a34a; color: white; }
        .btn-success:hover { background: #22c55e; }
        .btn-danger { background: #dc2626; color: white; }
        .btn-danger:hover { background: #ef4444; }
        .btn-secondary { background: #334155; color: white; }
        .btn-secondary:hover { background: #475569; }
        .btn-warning { background: #eab308; color: #422006; }

        @media (max-width: 768px) {
          .header { flex-direction: column; text-align: center; gap: 12px; }
          .header-left { flex-direction: column; }
          .main-container { padding: 12px; }
          .drawer { max-width: 100%; border-left: none; }
        }

        @media print {
          .header, .footer, .btn-icon, .no-print, .drawer, .drawer-overlay { display: none !important; }
          body, .litnum-root { background: white !important; color: black !important; }
          .table-card { box-shadow: none; border: none; }
          .score-table th { background: #eee !important; color: black !important; border-bottom: 2px solid #000; }
          .score-table td { color: black !important; border-bottom: 1px solid #ccc !important; }
          .total-cell { color: black !important; background: transparent !important; border: 1px solid #000; }
          .rank-circle { border: 1px solid #000; color: #000; }
          .rank-1, .rank-2, .rank-3 { background: transparent !important; color: #000 !important; font-weight: bold; box-shadow: none; }
        }
      `}</style>

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div style={{ display: 'flex', gap: '12px' }}>
            <img src={LOGO_KIRI} alt="SMK 45" className="logo-img" />
            <img src={LOGO_KANAN} alt="LITNUM" className="logo-img" />
          </div>
          <div>
            <h1 className="header-title">LITNUM FEST</h1>
            <p className="header-sub">
              Lomba Literasi dan Numerasi • Live Scoreboard
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span className="live-badge">● LIVE</span>
          <div
            style={{
              fontSize: '13px',
              color: '#bae6fd',
              fontFamily: 'monospace',
              fontWeight: 'bold',
            }}
          >
            {currentTime.toLocaleTimeString('id-ID')} WIB
          </div>
        </div>
      </header>

      {/* TABEL UTAMA */}
      <main className="main-container">
        <div className="table-card">
          <div className="table-responsive">
            <table className="score-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th style={{ textAlign: 'left', minWidth: '220px' }}>
                    Nama Kelompok
                  </th>
                  <th>Smart Quiz</th>
                  <th>Mystery Mission</th>
                  <th>Data Challenge</th>
                  <th>Jackpot</th>
                  <th style={{ fontSize: '16px' }}>TOTAL SCORE</th>
                </tr>
              </thead>
              <tbody>
                {sortedGroups.map((group, index) => {
                  const total = calculateTotal(group);
                  const complete = isComplete(group);

                  let rankClass = 'rank-circle';
                  if (index === 0) rankClass += ' rank-1';
                  else if (index === 1) rankClass += ' rank-2';
                  else if (index === 2) rankClass += ' rank-3';

                  return (
                    <tr key={group.id}>
                      <td>
                        <span className={rankClass}>{index + 1}</span>
                      </td>
                      <td>
                        <div className="group-name">
                          {group.name}
                          {!complete && (
                            <span className="badge-warning">Proses</span>
                          )}
                          {group.tb ? (
                            <span className="badge-tb">TB: {group.tb}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="score-cell">
                        {group.sq !== null ? group.sq : '-'}
                      </td>
                      <td className="score-cell">
                        {group.mm !== null ? group.mm : '-'}
                      </td>
                      <td className="score-cell">
                        {group.dc !== null ? group.dc : '-'}
                      </td>
                      <td className="score-cell">
                        {group.jp !== null ? (
                          <span className="score-jp">
                            {group.jp > 0 ? `+${group.jp}` : group.jp}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="total-cell">{complete ? total : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <span>
          &copy; {new Date().getFullYear()} LITNUM FEST - SMK 02 Islam 45 Ambulu
        </span>
        <button
          onClick={() =>
            isAdmin ? setIsDrawerOpen(true) : setShowPinModal(true)
          }
          className="btn-icon"
          title="Panel Panitia (Ctrl+Shift+A)"
        >
          {isAdmin ? (
            <IconUnlock size={22} color="#4ade80" />
          ) : (
            <IconLock size={22} />
          )}
        </button>
      </footer>

      {/* MODAL PIN LOGIN */}
      {showPinModal && (
        <div className="modal-overlay">
          <form onSubmit={handleLogin} className="modal-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#3b82f6',
              }}
            >
              <IconLock size={48} />
            </div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: '800',
                marginBottom: '8px',
              }}
            >
              Akses Panitia
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Masukkan PIN rahasia 6 digit untuk mengubah skor.
            </p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••••"
              className="pin-input"
              maxLength={6}
              autoFocus
            />
            {errorMsg && (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px',
                }}
              >
                {errorMsg}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Masuk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DRAWER ADMIN OVERLAY */}
      <div
        className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* DRAWER ADMIN PANEL */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconEdit size={22} /> Panel Pengelolaan
          </span>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="btn-icon"
            style={{ padding: '6px', color: 'white', border: 'none' }}
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="drawer-content">
          {/* Action Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setTimeout(() => window.print(), 400);
              }}
              className="btn btn-primary"
            >
              <IconPrinter size={18} /> Cetak PDF
            </button>
            <button onClick={handleResetAll} className="btn btn-danger">
              <IconRotateCcw size={18} /> Reset Skor
            </button>
          </div>

          <div
            style={{ height: '1px', background: '#1e293b', margin: '8px 0' }}
          ></div>

          {/* Group Edit List */}
          {sortedGroups.map((group) => (
            <div key={group.id} className="group-edit-card">
              {editingGroupId === group.id ? (
                <div>
                  <div className="input-group">
                    <span className="input-label">Nama Kelompok</span>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="input-grid">
                    <div className="input-group">
                      <span className="input-label">Smart Quiz (0-250)</span>
                      <input
                        type="number"
                        value={editForm.sq ?? ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sq: e.target.value })
                        }
                        className="input-field"
                        placeholder="-"
                      />
                    </div>
                    <div className="input-group">
                      <span className="input-label">
                        Mystery Mission (0-250)
                      </span>
                      <input
                        type="number"
                        value={editForm.mm ?? ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, mm: e.target.value })
                        }
                        className="input-field"
                        placeholder="-"
                      />
                    </div>
                    <div className="input-group">
                      <span className="input-label">
                        Data Challenge (0-300)
                      </span>
                      <input
                        type="number"
                        value={editForm.dc ?? ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dc: e.target.value })
                        }
                        className="input-field"
                        placeholder="-"
                      />
                    </div>
                    <div className="input-group">
                      <span
                        className="input-label"
                        style={{ color: '#FFC928' }}
                      >
                        Jackpot (+/-)
                      </span>
                      <input
                        type="number"
                        value={editForm.jp ?? ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, jp: e.target.value })
                        }
                        className="input-field"
                        placeholder="-"
                      />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginTop: '12px' }}>
                    <span className="input-label" style={{ color: '#d8b4fe' }}>
                      Tie-Breaker (Skor Penentu Seri)
                    </span>
                    <input
                      type="number"
                      value={editForm.tb ?? ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tb: e.target.value })
                      }
                      className="input-field"
                      placeholder="-"
                    />
                  </div>
                  <div
                    style={{ display: 'flex', gap: '12px', marginTop: '16px' }}
                  >
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-success"
                      style={{ flex: 1 }}
                    >
                      <IconSave size={18} /> Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '15px',
                        color: '#f1f5f9',
                      }}
                    >
                      {group.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      SQ: {group.sq ?? '-'} | MM: {group.mm ?? '-'} | DC:{' '}
                      {group.dc ?? '-'} | JP: {group.jp ?? '-'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGroupId(group.id);
                      setEditForm({ ...group });
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 12px' }}
                  >
                    <IconEdit size={16} /> Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
