document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const currentDateDisplay = document.getElementById('current-date-display');
    const tableBody = document.getElementById('table-body');
    const refreshBtn = document.getElementById('refresh-btn');
    const resetBtn = document.getElementById('reset-btn');
    const systemStatusSelect = document.getElementById('system-status-select');
    const statusContainer = document.getElementById('status-container');
    const limitContainer = document.getElementById('limit-container');
    const historyContainer = document.getElementById('history-container');
    const historyDateInput = document.getElementById('history-date-input');

    // Stats
    const statTotal = document.getElementById('stat-total');
    const statMenunggu = document.getElementById('stat-menunggu');
    const statSelesai = document.getElementById('stat-selesai');
    const maxQueueInput = document.getElementById('max-queue-input');

    // Authentication State
    let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
    let currentUser = sessionStorage.getItem('adminUser') || '';

    const checkAuth = () => {
        if (isAuthenticated) {
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            dashboardScreen.classList.add('flex');

            const istirahatBtn = document.getElementById('istirahat-btn');

            // Hide elements for admin1-admin7
            if (currentUser !== 'superadmin') {
                if (statusContainer) statusContainer.classList.add('hidden');
                if (limitContainer) limitContainer.classList.add('hidden');
                if (resetBtn) resetBtn.classList.add('hidden');
                if (historyContainer) historyContainer.classList.add('hidden');
                if (istirahatBtn) istirahatBtn.classList.remove('hidden');

                // Listen to Istirahat State
                if (useMock) {
                    mockDB.getCountersState((state) => {
                        // In mockDB, getCountersState returns the whole object
                        updateIstirahatUI(state[currentUser] || 'aktif');
                    });
                } else if (database) {
                    if (window.istirahatRef) window.istirahatRef.off();
                    window.istirahatRef = database.ref(`counters_state/${currentUser}`);
                    window.istirahatRef.on('value', (snapshot) => {
                        updateIstirahatUI(snapshot.val());
                    });
                }
            } else {
                if (statusContainer) statusContainer.classList.remove('hidden');
                if (limitContainer) limitContainer.classList.remove('hidden');
                if (resetBtn) resetBtn.classList.remove('hidden');
                if (historyContainer) historyContainer.classList.remove('hidden');
                if (istirahatBtn) istirahatBtn.classList.add('hidden');
            }

            const welcomeMessage = document.getElementById('welcome-message');
            const welcomeUser = document.getElementById('welcome-user');
            if (welcomeMessage && welcomeUser) {
                welcomeUser.textContent = currentUser;
                welcomeMessage.classList.remove('hidden');
            }

            loadData();
        } else {
            if (window.istirahatRef) { window.istirahatRef.off(); window.istirahatRef = null; }
            loginScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
            dashboardScreen.classList.remove('flex');
        }
    };

    // Istirahat UI Updater
    let isIstirahat = false;
    const updateIstirahatUI = (state) => {
        const istirahatBtn = document.getElementById('istirahat-btn');
        if (!istirahatBtn) return;
        isIstirahat = (state === 'istirahat');
        if (isIstirahat) {
            istirahatBtn.textContent = 'Selesai Istirahat';
            istirahatBtn.classList.remove('bg-orange-50', 'text-orange-600', 'border-orange-200', 'hover:bg-orange-100');
            istirahatBtn.classList.add('bg-orange-500', 'text-white', 'border-orange-600', 'hover:bg-orange-600');
        } else {
            istirahatBtn.textContent = 'Mulai Istirahat';
            istirahatBtn.classList.add('bg-orange-50', 'text-orange-600', 'border-orange-200', 'hover:bg-orange-100');
            istirahatBtn.classList.remove('bg-orange-500', 'text-white', 'border-orange-600', 'hover:bg-orange-600');
        }
    };

    // Initialize View
    checkAuth();

    // Password Visibility Toggle
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if (togglePassword && passwordInput && eyeIcon) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            if (type === 'text') {
                eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />`;
            } else {
                eyeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;
            }
        });
    }

    // Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        // Credentials requested by user: admin1 to admin7 with password SMA&7Makassar
        const validAdmins = ['admin1', 'admin2', 'admin3', 'admin4', 'admin5', 'admin6', 'admin7'];

        let loginSuccess = false;

        if (user === 'superadmin' && pass === 'admin') {
            loginSuccess = true;
        } else if (validAdmins.includes(user) && pass === 'SMA&7Makassar') {
            loginSuccess = true;
        }

        if (loginSuccess) {
            isAuthenticated = true;
            currentUser = user;
            sessionStorage.setItem('adminAuth', 'true');
            sessionStorage.setItem('adminUser', user);
            loginError.classList.add('hidden');
            loginForm.reset();
            checkAuth();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        isAuthenticated = false;
        currentUser = '';
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminUser');
        updateIstirahatUI('aktif'); // Reset state UI
        checkAuth();
    });

    // Istirahat Logic
    const istirahatBtn = document.getElementById('istirahat-btn');
    if (istirahatBtn) {
        istirahatBtn.addEventListener('click', async () => {
            if (!isAuthenticated || !currentUser || currentUser === 'superadmin') return;
            const newState = !isIstirahat;
            try {
                if (useMock) {
                    await mockDB.setCountersState(currentUser, newState ? 'istirahat' : 'aktif');
                    updateIstirahatUI(newState ? 'istirahat' : 'aktif');
                } else {
                    await database.ref(`counters_state/${currentUser}`).set(newState ? 'istirahat' : 'aktif');
                }
            } catch (error) {
                console.error("Error setting istirahat:", error);
                alert("Gagal memperbarui status istirahat.");
            }
        });
    }

    // Helper: Get Today's Date String (YYYY-MM-DD in WITA)
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

    const getDisplayDateString = () => {
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
        return `${d}-${m}-${y}`;
    };

    let selectedDate = getTodayDateString();

    if (historyDateInput) {
        historyDateInput.value = selectedDate;
        historyDateInput.addEventListener('change', (e) => {
            selectedDate = e.target.value;
            const parts = selectedDate.split('-');
            if (parts.length === 3) {
                currentDateDisplay.textContent = `Tanggal: ${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            if (isAuthenticated) loadData();
        });
    }

    // Update Date Display
    currentDateDisplay.textContent = `Tanggal: ${getDisplayDateString()}`;

    // Format Timestamp
    const formatTime = (ts) => {
        return new Date(ts).toLocaleString('id-ID', {
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' WITA';
    };

    // Render Table Data
    const renderTable = (queues) => {
        tableBody.innerHTML = '';

        let total = queues.length;
        let menunggu = 0;
        let selesai = 0;
        let melayaniList = [];

        if (total === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500">Belum ada antrian.</td></tr>`;
        }

        // Sort by nomor urut
        queues.sort((a, b) => a.noUrut - b.noUrut).forEach((q) => {
            if (q.status === 'Menunggu') menunggu++;
            if (q.status === 'Selesai') selesai++;
            if (q.status === 'Sedang diverifikasi') melayaniList.push(q.noUrut);

            let statusBadge = '';
            if (q.status === 'Menunggu') {
                statusBadge = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Menunggu</span>`;
            } else if (q.status === 'Selesai') {
                statusBadge = `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Selesai</span>`;
            } else if (q.status === 'Sedang diverifikasi') {
                statusBadge = `<span class="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">Sedang diverifikasi</span>`;
            } else {
                statusBadge = `<span class="px-2 py-1 bg-orange-800 text-white rounded-full text-xs font-medium">Tunda</span>`;
            }

            let adminCell = `<span class="text-gray-400">-</span>`;
            let disableActions = false;

            if (q.melayaniOleh) {
                if (q.status === 'Sedang diverifikasi') {
                    if (q.melayaniOleh === currentUser) {
                        adminCell = `<span class="text-orange-600 font-semibold text-xs capitalize">Anda Sedang Memverifikasi</span>`;
                    } else {
                        adminCell = `<span class="text-orange-600 font-medium text-xs capitalize">Sedang Diverifikasi Oleh ${q.melayaniOleh}</span>`;
                        if (currentUser !== 'superadmin') {
                            disableActions = true;
                        }
                    }
                } else if (q.status === 'Selesai') {
                    adminCell = `<span class="text-green-600 font-medium text-xs capitalize">Diverifikasi Oleh ${q.melayaniOleh}</span>`;
                } else {
                    adminCell = `<span class="text-gray-600 font-medium text-xs capitalize">${q.melayaniOleh}</span>`;
                }
            }

            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 transition-colors";
            tr.innerHTML = `
                <td class="px-6 py-4 font-semibold text-gray-800">#${String(q.noUrut).padStart(3, '0')}</td>
                <td class="px-6 py-4 font-medium text-blue-600">${q.namaMurid}</td>
                <td class="px-6 py-4 text-gray-600">${q.namaOrtu}</td>
                <td class="px-6 py-4 text-gray-600"><a href="https://wa.me/${q.noTelp}" target="_blank" class="hover:text-green-600">${q.noTelp}</a></td>
                <td class="px-6 py-4 text-gray-500">${formatTime(q.timestamp)}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4">${adminCell}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2 flex-wrap">
                        ${(selectedDate === getTodayDateString()) && (q.status === 'Menunggu' || q.status === 'Sedang diverifikasi' || q.status === 'Tunda') ? `
                            ${disableActions ? `<span class="text-xs text-orange-400 font-medium italic mt-1">Diverifikasi ${q.melayaniOleh}</span>` : `
                                ${q.status !== 'Sedang diverifikasi' ? `<button onclick="updateQueueStatus('${q.id}', 'Sedang diverifikasi', true)" class="px-3 py-1 bg-orange-400 hover:bg-orange-500 text-white rounded text-xs font-medium transition-colors shadow-sm">Verifikasi</button>` : ''}
                                ${q.status === 'Sedang diverifikasi' ? `<button onclick="updateQueueStatus('${q.id}', 'Sedang diverifikasi', true)" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors shadow-sm">Panggil Ulang</button>` : ''}
                                ${q.status !== 'Selesai' ? `<button onclick="updateQueueStatus('${q.id}', 'Selesai')" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors shadow-sm">Selesai</button>` : ''}
                                ${q.status !== 'Tunda' ? `<button onclick="updateQueueStatus('${q.id}', 'Tunda')" class="px-3 py-1 bg-orange-700 hover:bg-orange-800 text-white rounded text-xs font-medium transition-colors shadow-sm">Tunda</button>` : ''}
                            `}
                        ` : `
                            ${(selectedDate !== getTodayDateString() || q.status === 'Selesai') ? `<span class="text-xs text-gray-400 italic self-center">${q.status === 'Selesai' ? 'Selesai' : 'History'}</span>` : ''}
                        `}
                        
                        ${currentUser === 'superadmin' ? `
                            <button onclick="deleteQueueItem('${q.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors shadow-sm">Hapus</button>
                        ` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Update Stats
        statTotal.textContent = total;
        statMenunggu.textContent = menunggu;
        statSelesai.textContent = selesai;
    };

    // Firebase Real-time Listener Reference
    let queuesRef = null;

    // Load Data
    const loadData = () => {
        tableBody.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-gray-500"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>Memuat data...</td></tr>`;

        if (useMock) {
            mockDB.getQueues((data) => {
                if (isAuthenticated) renderTable(data);
            });
        } else {
            const dateKey = selectedDate;

            // Unsubscribe from previous if exists
            if (queuesRef) queuesRef.off();

            queuesRef = database.ref(`queues/${dateKey}`);
            queuesRef.on('value', (snapshot) => {
                if (!isAuthenticated) return;
                const data = snapshot.val();
                const queuesArray = [];
                if (data) {
                    Object.keys(data).forEach(key => {
                        queuesArray.push({
                            id: key,
                            ...data[key]
                        });
                    });
                }
                renderTable(queuesArray);
            }, (error) => {
                console.error("Firebase Read Error:", error);
                tableBody.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-red-500">Gagal memuat data dari database. Pastikan koneksi atau aturan Firebase sudah benar.</td></tr>`;
            });
        }
    };

    // Refresh Button
    refreshBtn.addEventListener('click', () => {
        if (isAuthenticated) loadData();
    });

    // Load Initial System Status & Max Queue
    if (useMock) {
        mockDB.getSystemStatus((status) => {
            if (systemStatusSelect.value !== status) {
                systemStatusSelect.value = status;
            }
        });
        mockDB.getMaxQueue((max) => {
            const displayMax = (max !== null && max !== "") ? max : 200;
            if (maxQueueInput.value != displayMax) {
                maxQueueInput.value = displayMax;
            }
        });
    } else {
        database.ref('system_status').on('value', (snapshot) => {
            const status = snapshot.val() || 'auto';
            if (systemStatusSelect.value !== status) {
                systemStatusSelect.value = status;
            }
        });
        database.ref('settings/max_queue').on('value', (snapshot) => {
            const max = snapshot.val();
            const displayMax = (max !== null && max !== "") ? max : 200;
            if (maxQueueInput.value != displayMax) {
                maxQueueInput.value = displayMax;
            }
        });
    }

    // Change System Status
    systemStatusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        try {
            if (useMock) {
                await mockDB.setSystemStatus(newStatus);
            } else {
                await database.ref('system_status').set(newStatus);
            }
        } catch (error) {
            console.error("Error setting system status:", error);
            alert("Gagal mengubah status antrian.");
        }
    });

    // Change Max Queue
    let maxQueueTimeout = null;
    maxQueueInput.addEventListener('input', (e) => {
        const newVal = e.target.value;
        clearTimeout(maxQueueTimeout);
        maxQueueTimeout = setTimeout(async () => {
            try {
                if (useMock) {
                    await mockDB.setMaxQueue(newVal);
                } else {
                    await database.ref('settings/max_queue').set(newVal ? parseInt(newVal) : null);
                }
            } catch (error) {
                console.error("Error setting max queue:", error);
            }
        }, 500); // debounce
    });

    // Reset Queue Logic
    resetBtn.addEventListener('click', async () => {
        if (selectedDate !== getTodayDateString()) {
            alert("Anda hanya bisa mereset antrian untuk hari ini.");
            return;
        }

        if (!confirm('PERINGATAN: Anda yakin ingin MENGHAPUS SEMUA antrian hari ini dan mengulang nomor urut kembali ke 1?\\nTindakan ini tidak bisa dibatalkan!')) return;

        try {
            if (useMock) {
                await mockDB.resetQueue();
            } else {
                const dateKey = getTodayDateString();
                await database.ref(`queues/${dateKey}`).remove();
                await database.ref(`counters/${dateKey}`).remove();
            }
            alert("Antrian hari ini berhasil direset.");
            if (isAuthenticated) loadData();
        } catch (error) {
            console.error("Error resetting queue:", error);
            alert("Gagal mereset antrian.");
        }
    });

    // Global Action for Buttons (Since they are created dynamically)
    window.updateQueueStatus = async (id, newStatus, skipConfirm = false) => {
        if (!skipConfirm && !confirm(`Yakin ingin mengubah status antrian menjadi "${newStatus}"?`)) return;

        try {
            if (useMock) {
                await mockDB.updateStatus(id, newStatus, currentUser);
                // Data will refresh via the mockDB polling loop, or we can trigger it:
                loadData();
            } else {
                const dateKey = getTodayDateString();
                let updates = { status: newStatus };
                if (newStatus === 'Sedang diverifikasi') {
                    updates.melayaniOleh = currentUser || 'superadmin';
                    updates.lastCalledAt = Date.now(); // Tambahkan timestamp panggilan
                }
                await database.ref(`queues/${dateKey}/${id}`).update(updates);
                // No need to call renderTable, Firebase Real-time listener will trigger
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Gagal memperbarui status.");
        }
    };
    
    // Delete Queue Item Logic (Superadmin only)
    window.deleteQueueItem = async (id) => {
        if (currentUser !== 'superadmin') {
            alert("Hanya superadmin yang bisa menghapus antrian.");
            return;
        }

        if (!confirm('Apakah Anda yakin ingin menghapus antrian ini? Tindakan ini tidak bisa dibatalkan.')) return;

        try {
            if (useMock) {
                // Mock delete not fully implemented, but let's assume it works
                alert("Fitur hapus tidak tersedia di mode Mock.");
            } else {
                const dateKey = selectedDate;
                await database.ref(`queues/${dateKey}/${id}`).remove();
                alert("Antrian berhasil dihapus.");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Gagal menghapus antrian.");
        }
    };
});
