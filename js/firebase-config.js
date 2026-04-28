// Konfigurasi Firebase Anda
// Ganti nilai-nilai di bawah ini dengan konfigurasi dari Firebase Console Anda
// Project Settings -> General -> Your apps -> Firebase SDK snippet -> Config

// Catatan: Key yang diberikan (wtKuq7Of6-zmW5u_NxOUyH91DCR3pjNvjFRqXGkT504) sepertinya adalah Database Secret.
// Untuk penggunaan di sisi klien (Web), Anda membutuhkan konfigurasi lengkap seperti di bawah ini.

const firebaseConfig = {
    apiKey: "AIzaSyA0J2mX647pGA0O9t8kh6IGUs8sIlnBrhI",
    authDomain: "antrian-smanet-a5395.firebaseapp.com",
    databaseURL: "https://antrian-smanet-default-rtdb.firebaseio.com",
    projectId: "antrian-smanet",
    storageBucket: "antrian-smanet.firebasestorage.app",
    messagingSenderId: "226914431198",
    appId: "1:226914431198:web:76c68225e78ef57d35124f"
};

// Fallback Mock LocalStorage jika Firebase gagal terhubung
let useMock = false;

// Coba inisialisasi Firebase
let database;
try {
    // Initialize Firebase
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log("Firebase berhasil diinisialisasi.");
        
        // Test connection
        database.ref('.info/connected').on('value', (snap) => {
            if (snap.val() === true) {
                console.log("Terhubung ke Firebase Realtime Database.");
                useMock = false;
            } else {
                console.warn("Terputus dari Firebase. Menunggu koneksi...");
                // Note: We don't necessarily switch to mock here because Firebase handles reconnections
            }
        });
    } else {
        throw new Error("Firebase SDK tidak ditemukan");
    }
} catch (error) {
    console.warn("Firebase tidak dapat diinisialisasi, menggunakan mode MOCK (Lokal):", error.message);
    useMock = true;
}

// Fungsi pembantu untuk Mocking jika diperlukan
const mockDB = {
    getTodayKey: () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },
    saveQueue: (data) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const today = mockDB.getTodayKey();
                const queues = JSON.parse(localStorage.getItem(`queues_${today}`) || '[]');
                const noUrut = queues.length + 1;
                
                const newQueue = {
                    id: 'mock_' + Date.now(),
                    noUrut: noUrut,
                    timestamp: Date.now(),
                    status: 'Menunggu',
                    ...data
                };
                
                queues.push(newQueue);
                localStorage.setItem(`queues_${today}`, JSON.stringify(queues));
                resolve(newQueue);
            }, 800);
        });
    },
    _queuesListener: null,
    getQueues: (callback) => {
        const today = mockDB.getTodayKey();
        const update = () => {
            const queues = JSON.parse(localStorage.getItem(`queues_${today}`) || '[]');
            callback(queues);
        };
        update();
        
        if (mockDB._queuesListener) window.removeEventListener('storage', mockDB._queuesListener);
        
        mockDB._queuesListener = update;
        window.addEventListener('storage', mockDB._queuesListener);
    },
    updateStatus: (id, newStatus, currentUser) => {
        return new Promise((resolve) => {
            const today = mockDB.getTodayKey();
            const queues = JSON.parse(localStorage.getItem(`queues_${today}`) || '[]');
            const index = queues.findIndex(q => q.id === id);
            if (index > -1) {
                queues[index].status = newStatus;
                if (newStatus === 'Sedang diverifikasi') {
                    queues[index].melayaniOleh = currentUser || 'superadmin';
                }
                localStorage.setItem(`queues_${today}`, JSON.stringify(queues));
            }
            resolve();
        });
    },
    _statusListener: null,
    getSystemStatus: (callback) => {
        const update = () => {
            const status = localStorage.getItem('system_status') || 'auto';
            callback(status);
        };
        update();
        
        if (mockDB._statusListener) window.removeEventListener('storage', mockDB._statusListener);
        
        mockDB._statusListener = update;
        window.addEventListener('storage', mockDB._statusListener);
    },
    setSystemStatus: (status) => {
        return new Promise((resolve) => {
            localStorage.setItem('system_status', status);
            resolve();
        });
    },
    _maxListener: null,
    getMaxQueue: (callback) => {
        const update = () => {
            const max = localStorage.getItem('max_queue') || ''; 
            callback(max);
        };
        update();
        
        if (mockDB._maxListener) window.removeEventListener('storage', mockDB._maxListener);
        
        mockDB._maxListener = update;
        window.addEventListener('storage', mockDB._maxListener);
    },
    setMaxQueue: (max) => {
        return new Promise((resolve) => {
            localStorage.setItem('max_queue', max);
            resolve();
        });
    },
    resetQueue: () => {
        return new Promise((resolve) => {
            const today = mockDB.getTodayKey();
            localStorage.removeItem(`queues_${today}`);
            resolve();
        });
    },
    _countersListener: null,
    getCountersState: (callback) => {
        const update = () => {
            const state = JSON.parse(localStorage.getItem('counters_state') || '{}');
            callback(state);
        };
        update();
        
        if (mockDB._countersListener) window.removeEventListener('storage', mockDB._countersListener);
        
        mockDB._countersListener = update;
        window.addEventListener('storage', mockDB._countersListener);
    },
    setCountersState: (adminId, stateStr) => {
        return new Promise((resolve) => {
            const state = JSON.parse(localStorage.getItem('counters_state') || '{}');
            state[adminId] = stateStr;
            localStorage.setItem('counters_state', JSON.stringify(state));
            
            // Dispatch event to trigger update in the same window (for single-window testing)
            window.dispatchEvent(new Event('storage'));
            resolve();
        });
    }
};
