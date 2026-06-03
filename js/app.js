document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const loadingState = document.getElementById('loading-state');
    const closedMessage = document.getElementById('closed-message');
    const fullMessage = document.getElementById('full-message');
    const queueForm = document.getElementById('queue-form');
    const successOutput = document.getElementById('success-output');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    // Display elements
    const displayNum = document.getElementById('display-number');
    const displayNamaMurid = document.getElementById('display-nama-murid');
    const displayWaktu = document.getElementById('display-waktu');

    // Format date string for Firebase keys (YYYY-MM-DD)
    const getTodayDateString = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Makassar',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const y = parts.find(p => p.type === 'year').value;
        const m = parts.find(p => p.type === 'month').value;
        const d = parts.find(p => p.type === 'day').value;
        return `${y}-${m}-${d}`;
    };

    let systemStatus = 'auto'; // 'auto', 'open', 'closed'
    let maxQueueLimit = 200; // Default 200
    let currentQueueCount = 0;
    let systemSchedule = {
        openTime: "08:00",
        closeTime: "12:00",
        operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    };

    // Check Operating Hours based on schedule
    const checkOperatingHours = () => {
        if (systemStatus === 'open') return true;
        if (systemStatus === 'closed') return false;

        const now = new Date();
        
        // Get day in WITA (Asia/Makassar)
        const dayStr = now.toLocaleDateString('en-US', {
            timeZone: 'Asia/Makassar',
            weekday: 'short'
        });
        const isOperatingDay = systemSchedule.operatingDays.includes(dayStr);

        // Get time in WITA (HH:mm format)
        const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const currentTimeStr = timeFormatter.format(now);
        
        return isOperatingDay && currentTimeStr >= systemSchedule.openTime && currentTimeStr < systemSchedule.closeTime;
    };

    const updateViewBasedOnStatus = () => {
        // Only update if not currently loading or in success screen
        if (!loadingState.classList.contains('hidden')) return;
        if (!successOutput.classList.contains('hidden')) return;

        if (checkOperatingHours()) {
            if (maxQueueLimit !== null && currentQueueCount >= maxQueueLimit) {
                queueForm.classList.add('hidden');
                closedMessage.classList.add('hidden');
                fullMessage.classList.remove('hidden');
            } else {
                queueForm.classList.remove('hidden');
                closedMessage.classList.add('hidden');
                fullMessage.classList.add('hidden');
            }
        } else {
            queueForm.classList.add('hidden');
            closedMessage.classList.remove('hidden');
            fullMessage.classList.add('hidden');
            
            // Update closed message text dynamically
            const closedTextEl = closedMessage.querySelector('p');
            if (closedTextEl) {
                const daysMap = { 'Mon': 'Senin', 'Tue': 'Selasa', 'Wed': 'Rabu', 'Thu': 'Kamis', 'Fri': 'Jumat', 'Sat': 'Sabtu', 'Sun': 'Minggu' };
                const daysTranslated = systemSchedule.operatingDays.map(d => daysMap[d]).join(', ');
                closedTextEl.innerHTML = `Pendaftaran Antrian Ditutup.<br>Buka Kembali Hari: ${daysTranslated || 'Belum diatur'}, Jam ${systemSchedule.openTime} - ${systemSchedule.closeTime} WITA.`;
            }
        }
    };

    // Listen to system status and queue settings
    if (useMock) {
        mockDB.getSystemStatus((status) => {
            systemStatus = status;
            updateViewBasedOnStatus();
        });
        mockDB.getMaxQueue((max) => {
            maxQueueLimit = (max !== null && max !== "") ? parseInt(max) : 200;
            updateViewBasedOnStatus();
        });
        mockDB.getSchedule((schedule) => {
            if (schedule) systemSchedule = schedule;
            updateViewBasedOnStatus();
        });
        // mock count
        const today = getTodayDateString();
        setInterval(() => {
            const queues = JSON.parse(localStorage.getItem(`queues_${today}`) || '[]');
            currentQueueCount = queues.length;
            updateViewBasedOnStatus();
        }, 2000);
    } else {
        database.ref('system_status').on('value', (snapshot) => {
            systemStatus = snapshot.val() || 'auto';
            updateViewBasedOnStatus();
        });
        database.ref('settings/max_queue').on('value', (snapshot) => {
            const max = snapshot.val();
            maxQueueLimit = (max !== null && max !== "") ? parseInt(max) : 200;
            updateViewBasedOnStatus();
        });
        database.ref('settings/schedule').on('value', (snapshot) => {
            const schedule = snapshot.val();
            if (schedule) {
                if (!schedule.operatingDays) schedule.operatingDays = [];
                systemSchedule = schedule;
            }
            updateViewBasedOnStatus();
        });
        const dateKey = getTodayDateString();
        database.ref(`counters/${dateKey}`).on('value', (snapshot) => {
            currentQueueCount = snapshot.val() || 0;
            updateViewBasedOnStatus();
        });
    }

    // Auto-update UI every minute to handle time-based open/close seamlessly
    setInterval(() => {
        updateViewBasedOnStatus();
    }, 60000);

    // Initialize View
    setTimeout(() => {
        loadingState.classList.add('hidden');
        updateViewBasedOnStatus();
    }, 800); // Simulate network check for smooth UI

    // Form Submit Handler
    queueForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Final time check on submit
        if (!checkOperatingHours()) {
            alert(`Maaf, waktu pendaftaran sudah ditutup. Silakan kembali pada jam ${systemSchedule.openTime} - ${systemSchedule.closeTime} WITA di hari kerja.`);
            window.location.reload();
            return;
        }

        const namaOrtu = document.getElementById('namaOrtu').value.trim();
        const namaMurid = document.getElementById('namaMurid').value.trim();
        const noTelp = document.getElementById('noTelp').value.trim();

        if (!namaOrtu || !namaMurid || !noTelp) return;

        // UI Loading State
        submitBtn.disabled = true;
        btnText.textContent = 'Memproses...';
        btnSpinner.classList.remove('hidden');

        const queueData = {
            namaOrtu,
            namaMurid,
            noTelp,
            timestamp: Date.now() // UTC timestamp, will be formatted on display
        };

        try {
            let resultData;

            if (useMock) {
                if (maxQueueLimit !== null && currentQueueCount >= maxQueueLimit) {
                    throw new Error("Kuota penuh");
                }
                // Gunakan MockDB (LocalStorage)
                resultData = await mockDB.saveQueue(queueData);
            } else {
                // Gunakan Firebase Realtime Database
                const dateKey = getTodayDateString();
                const counterRef = database.ref(`counters/${dateKey}`);
                
                let limitExceeded = false;

                // Transaction to safely increment queue number
                const transactionResult = await counterRef.transaction((currentCount) => {
                    if (maxQueueLimit !== null && (currentCount || 0) >= maxQueueLimit) {
                        limitExceeded = true;
                        return; // Abort transaction if limit reached
                    }
                    return (currentCount || 0) + 1;
                });

                if (limitExceeded) {
                    throw new Error("Kuota penuh");
                }

                if (transactionResult.committed) {
                    const noUrut = transactionResult.snapshot.val();
                    const queueRef = database.ref(`queues/${dateKey}`).push();
                    
                    const newQueue = {
                        noUrut: noUrut,
                        status: 'Menunggu',
                        ...queueData
                    };
                    
                    await queueRef.set(newQueue);
                    resultData = { id: queueRef.key, ...newQueue };
                } else {
                    throw new Error("Gagal mengambil nomor antrian.");
                }
            }

            // Show Success Output
            queueForm.classList.add('hidden');
            successOutput.classList.remove('hidden');
            
            // Format Number
            displayNum.textContent = String(resultData.noUrut).padStart(3, '0');
            displayNamaMurid.textContent = `Calon Murid: ${resultData.namaMurid}`;
            
            // Format Time in WITA
            const timeStr = new Date(resultData.timestamp).toLocaleString('id-ID', {
                timeZone: 'Asia/Makassar',
                dateStyle: 'medium',
                timeStyle: 'short'
            }) + ' WITA';
            displayWaktu.textContent = `Waktu Daftar: ${timeStr}`;

        } catch (error) {
            console.error(error);
            if (error.message === "Kuota penuh") {
                alert('Mohon maaf, kuota antrian telah penuh.');
                window.location.reload();
            } else {
                alert('Terjadi kesalahan saat memproses antrian. Silakan coba lagi.');
            }
        } finally {
            // Reset Button State
            submitBtn.disabled = false;
            btnText.textContent = 'Ambil Antrian';
            btnSpinner.classList.add('hidden');
        }
    });

    // Reset Form for New Queue (Optional, useful if testing)
    document.getElementById('new-queue-btn').addEventListener('click', () => {
        queueForm.reset();
        successOutput.classList.add('hidden');
        
        updateViewBasedOnStatus();
    });
});
