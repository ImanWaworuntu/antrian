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
    const queueSubtitle = document.getElementById('queue-subtitle');

    // Display elements
    const displayNum = document.getElementById('display-number');
    const displayNamaMurid = document.getElementById('display-nama-murid');
    const displayWaktu = document.getElementById('display-waktu');

    // Format date string for Firebase keys (YYYY-MM-DD)
    const getTodayDateString = () => {
        const now = new Date(Date.now() + (window.serverTimeOffset || 0));
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
    let isConnected = typeof useMock !== 'undefined' ? useMock : true;
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

        const now = new Date(Date.now() + (window.serverTimeOffset || 0));
        
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

        const cooldownMessage = document.getElementById('cooldown-message');
        const lastQueueTime = localStorage.getItem('last_queue_time');
        const COOLDOWN_MS = 5 * 60 * 1000;
        
        if (window.cooldownTimeout) clearTimeout(window.cooldownTimeout);
        
        if (lastQueueTime) {
            const timeDiff = Date.now() - parseInt(lastQueueTime);
            if (timeDiff < COOLDOWN_MS) {
                queueForm.classList.add('hidden');
                closedMessage.classList.add('hidden');
                fullMessage.classList.add('hidden');
                if (cooldownMessage) cooldownMessage.classList.remove('hidden');
                if (queueSubtitle) {
                    queueSubtitle.className = "mt-2 relative z-10";
                    queueSubtitle.innerHTML = `<span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-blue-500 text-white shadow-md border border-blue-400">Harap Tunggu</span>`;
                }
                
                const timerEl = document.getElementById('cooldown-timer');
                if (timerEl) {
                    const updateTimer = () => {
                        const remaining = COOLDOWN_MS - (Date.now() - parseInt(localStorage.getItem('last_queue_time') || '0'));
                        if (remaining <= 0) {
                            localStorage.removeItem('last_queue_time');
                            updateViewBasedOnStatus();
                        } else {
                            const m = Math.floor(remaining / 60000);
                            const s = Math.floor((remaining % 60000) / 1000);
                            timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
                            if (!successOutput.classList.contains('hidden')) return;
                            window.cooldownTimeout = setTimeout(updateTimer, 1000);
                        }
                    };
                    updateTimer();
                }
                return;
            } else {
                localStorage.removeItem('last_queue_time');
                if (cooldownMessage) cooldownMessage.classList.add('hidden');
            }
        } else {
            if (cooldownMessage) cooldownMessage.classList.add('hidden');
        }


        if (!isConnected && (typeof useMock === 'undefined' || !useMock)) {
            queueForm.classList.add('hidden');
            closedMessage.classList.remove('hidden');
            fullMessage.classList.add('hidden');
            if (queueSubtitle) {
                queueSubtitle.className = "text-indigo-100 text-sm mt-1 relative z-10";
                queueSubtitle.textContent = 'Menunggu jaringan...';
            }
            const closedTextEl = closedMessage.querySelector('p');
            if (closedTextEl) closedTextEl.innerHTML = `Koneksi ke server terputus.<br>Menunggu jaringan stabil untuk melanjutkan pendaftaran...`;
            return;
        }

        if (checkOperatingHours()) {
            if (maxQueueLimit !== null && currentQueueCount >= maxQueueLimit) {
                queueForm.classList.add('hidden');
                closedMessage.classList.add('hidden');
                fullMessage.classList.remove('hidden');
                if (queueSubtitle) {
                    queueSubtitle.className = "mt-2 relative z-10";
                    queueSubtitle.innerHTML = `<span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white animate-pulse shadow-md border border-red-400">Kuota Antrian: 0</span>`;
                }
            } else {
                queueForm.classList.remove('hidden');
                closedMessage.classList.add('hidden');
                fullMessage.classList.add('hidden');
                const remainingQuota = maxQueueLimit !== null ? maxQueueLimit - currentQueueCount : 'Tidak Terbatas';
                if (queueSubtitle) {
                    queueSubtitle.className = "mt-2 relative z-10";
                    queueSubtitle.innerHTML = `<span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white animate-pulse shadow-md border border-red-400">Kuota Antrian: ${remainingQuota}</span>`;
                }
            }
        } else {
            queueForm.classList.add('hidden');
            closedMessage.classList.remove('hidden');
            fullMessage.classList.add('hidden');
            if (queueSubtitle) {
                queueSubtitle.className = "text-indigo-100 text-sm mt-1 relative z-10";
                queueSubtitle.textContent = 'Ambil nomor antrian Anda dengan mudah';
            }
            
            // Update closed message text dynamically
            const closedTextEl = closedMessage.querySelector('p');
            if (closedTextEl) {
                if (!systemSchedule.operatingDays || systemSchedule.operatingDays.length === 0) {
                    closedTextEl.innerHTML = `Pendaftaran Antrian Ditutup.<br><br>Informasi selanjutnya di Grup WhatsApp SOSIALISASI SPMB 2026 SMAN 7 Makassar.<br><a href="https://chat.whatsapp.com/GnPynLzJHfbIoYaOVKrsY4" target="_blank" class="text-indigo-600 hover:text-indigo-800 underline font-medium">Link Grup: https://chat.whatsapp.com/GnPynLzJHfbIoYaOVKrsY4</a>`;
                } else {
                    const daysMap = { 'Mon': 'Senin', 'Tue': 'Selasa', 'Wed': 'Rabu', 'Thu': 'Kamis', 'Fri': 'Jumat', 'Sat': 'Sabtu', 'Sun': 'Minggu' };
                    const daysTranslated = systemSchedule.operatingDays.map(d => daysMap[d]).join(', ');
                    closedTextEl.innerHTML = `Pendaftaran Antrian Ditutup.<br>Buka Kembali Hari: ${daysTranslated}, Jam ${systemSchedule.openTime} - ${systemSchedule.closeTime} WITA.`;
                }
            }
        }
    };

    // Listen to system status and queue settings
    window.addEventListener('firebaseConnectionState', (e) => {
        isConnected = e.detail;
        updateViewBasedOnStatus();
    });

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
        
        let currentCounterDateKey = null;
        let counterRefListener = null;

        const checkDateKey = () => {
            const dateKey = getTodayDateString();
            if (currentCounterDateKey !== dateKey) {
                if (counterRefListener) {
                    counterRefListener.off();
                }
                currentCounterDateKey = dateKey;
                counterRefListener = database.ref(`counters/${dateKey}`);
                counterRefListener.on('value', (snapshot) => {
                    currentQueueCount = snapshot.val() || 0;
                    updateViewBasedOnStatus();
                });
            }
        };

        checkDateKey();
        window.addEventListener('serverTimeOffsetChanged', checkDateKey);
        setInterval(checkDateKey, 60000);
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

        const clientDisplayTime = Date.now() + (window.serverTimeOffset || 0);
        const queueData = {
            namaOrtu,
            namaMurid,
            noTelp,
            timestamp: typeof useMock !== 'undefined' && useMock ? clientDisplayTime : firebase.database.ServerValue.TIMESTAMP
        };

        try {
            let resultData;

            if (useMock) {
                if (maxQueueLimit !== null && currentQueueCount >= maxQueueLimit) {
                    throw new Error("Kuota penuh");
                }
                const mockDateKey = getTodayDateString();
                const queuesMock = JSON.parse(localStorage.getItem(`queues_${mockDateKey}`) || '[]');
                if (queuesMock.some(q => q.namaMurid.toLowerCase() === namaMurid.toLowerCase())) {
                    throw new Error(`Nama "${namaMurid}" sudah terdaftar.`);
                }
                // Gunakan MockDB (LocalStorage)
                resultData = await mockDB.saveQueue(queueData);
            } else {
                // Gunakan Firebase Realtime Database
                const dateKey = getTodayDateString();
                
                const snapshot = await database.ref(`queues/${dateKey}`).once('value');
                const queues = snapshot.val();
                if (queues) {
                    const isDuplicate = Object.values(queues).some(q => 
                        q.namaMurid.toLowerCase() === namaMurid.toLowerCase()
                    );
                    if (isDuplicate) {
                        throw new Error(`Nama "${namaMurid}" sudah terdaftar.`);
                    }
                }

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
            // Set cooldown
            localStorage.setItem('last_queue_time', Date.now().toString());

            // Show Success Output
            queueForm.classList.add('hidden');
            successOutput.classList.remove('hidden');
            
            // Format Number
            displayNum.textContent = String(resultData.noUrut).padStart(3, '0');
            displayNamaMurid.textContent = `Calon Murid: ${resultData.namaMurid}`;
            
            // Format Time in WITA
            const displayTimestamp = (typeof useMock !== 'undefined' && useMock) ? resultData.timestamp : clientDisplayTime;
            const timeStr = new Date(displayTimestamp).toLocaleString('id-ID', {
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
            } else if (error.message.includes("sudah terdaftar")) {
                alert(error.message);
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
