// Konfigurasi Firebase Anda
// Ganti nilai-nilai di bawah ini dengan konfigurasi dari Firebase Console Anda
// Project Settings -> General -> Your apps -> Firebase SDK snippet -> Config

// Catatan: Key yang diberikan (wtKuq7Of6-zmW5u_NxOUyH91DCR3pjNvjFRqXGkT504) sepertinya adalah Database Secret.
// Untuk penggunaan di sisi klien (Web), Anda membutuhkan konfigurasi lengkap seperti di bawah ini.

const firebaseConfig = {
    apiKey: "GANTI_DENGAN_API_KEY_ANDA",
    authDomain: "GANTI_DENGAN_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://GANTI_DENGAN_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "GANTI_DENGAN_PROJECT_ID",
    storageBucket: "GANTI_DENGAN_PROJECT_ID.appspot.com",
    messagingSenderId: "GANTI_DENGAN_SENDER_ID",
    appId: "GANTI_DENGAN_APP_ID"
};

// Coba inisialisasi Firebase
let database;
try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase berhasil diinisialisasi.");
} catch (error) {
    console.warn("Firebase belum dikonfigurasi dengan benar. Mode mock (lokal) akan digunakan untuk keperluan preview.");
}

// Fallback Mock LocalStorage jika Firebase belum dikonfigurasi (HANYA UNTUK PREVIEW)
const useMock = !database || firebaseConfig.apiKey.includes("GANTI_DENGAN");

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
