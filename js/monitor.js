document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    const currentNumberEl = document.getElementById('current-serving-number');
    const currentNameEl = document.getElementById('current-serving-name');
    const waitingListEl = document.getElementById('waiting-list');
    const waitingCountEl = document.getElementById('waiting-count');
    const audioOverlay = document.getElementById('audio-unlock-overlay');
    window.speechUtterances = []; // To prevent garbage collection bug in some browsers

    // Initialize Voices
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    // Handle Audio Unlock Overlay
    if (audioOverlay) {
        audioOverlay.addEventListener('click', () => {
            if ('speechSynthesis' in window) {
                // Play silent utterance to unlock audio context
                const utterance = new SpeechSynthesisUtterance('');
                window.speechSynthesis.speak(utterance);
            }
            audioOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => audioOverlay.remove(), 300);
        });
    }

    // Live Clock
    const updateClock = () => {
        const now = new Date();
        
        // Time
        clockTime.textContent = now.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Makassar',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Date
        clockDate.textContent = now.toLocaleDateString('id-ID', {
            timeZone: 'Asia/Makassar',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    setInterval(updateClock, 1000);
    updateClock();

    // Helper: Get Today's Date String
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

    const currentComputerEl = document.getElementById('current-serving-computer');
    const countersContainerEl = document.getElementById('counters-container');

    // State for animations and latest call
    let prevServingNumber = null;
    let prevServingQueues = [];
    let latestCalledQueue = null;
    
    // Global Data Store
    let globalQueues = [];
    let countersState = {};

    const speakQueue = (numberStr, computerName) => {
        if (!('speechSynthesis' in window)) return;
        
        console.log("Memanggil antrian:", numberStr, "ke", computerName);

        const digitMap = {
            '0': 'nol',
            '1': 'satu',
            '2': 'dua',
            '3': 'tiga',
            '4': 'empat',
            '5': 'lima',
            '6': 'enam',
            '7': 'tujuh',
            '8': 'delapan',
            '9': 'sembilan'
        };
        const spelledNumber = numberStr.split('').map(d => digitMap[d] || d).join(' ');
        const text = `Antrian, ${spelledNumber}, ke ${computerName}`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.85;
        
        // Explicitly set an Indonesian voice if available
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.includes('id'));
        if (idVoice) {
            utterance.voice = idVoice;
        }
        
        window.speechUtterances.push(utterance); // Prevent GC
        
        // Clean up old utterances
        if (window.speechUtterances.length > 10) {
            window.speechUtterances.shift();
        }

        window.speechSynthesis.speak(utterance);
    };

    const triggerRender = () => {
        renderMonitor([...globalQueues], countersState);
    };

    // Render Data
    const renderMonitor = (queues, states = {}) => {
        // Sort
        queues.sort((a, b) => a.noUrut - b.noUrut);

        // Find Current Serving
        const serving = queues.filter(q => q.status === 'Sedang diverifikasi');
        
        // Define Counters (Komputer 1 - 7 mapping to admin1 - admin7)
        const countersData = [
            { id: 'admin1', name: 'Komputer 1', queue: null, state: states['admin1'] || 'aktif' },
            { id: 'admin2', name: 'Komputer 2', queue: null, state: states['admin2'] || 'aktif' },
            { id: 'admin3', name: 'Komputer 3', queue: null, state: states['admin3'] || 'aktif' },
            { id: 'admin4', name: 'Komputer 4', queue: null, state: states['admin4'] || 'aktif' },
            { id: 'admin5', name: 'Komputer 5', queue: null, state: states['admin5'] || 'aktif' },
            { id: 'admin6', name: 'Komputer 6', queue: null, state: states['admin6'] || 'aktif' },
            { id: 'admin7', name: 'Komputer 7', queue: null, state: states['admin7'] || 'aktif' },
        ];

        // Map serving queues to their respective counters
        serving.forEach(q => {
            const adminId = q.melayaniOleh;
            const counter = countersData.find(c => c.id === adminId);
            if (counter && counter.state !== 'istirahat') {
                // If an admin has multiple (edge case), take the latest
                if (!counter.queue || counter.queue.noUrut < q.noUrut) {
                    counter.queue = q;
                }
            }
        });

        // Determine Latest Called Queue for Main Display
        const newCalls = serving.filter(q => !prevServingQueues.some(pq => pq.id === q.id));
        if (newCalls.length > 0) {
            newCalls.sort((a, b) => b.noUrut - a.noUrut);
            latestCalledQueue = newCalls[0];
        } else if (serving.length === 0) {
            latestCalledQueue = null;
        } else if (latestCalledQueue && !serving.some(q => q.id === latestCalledQueue.id)) {
            // Latest called queue is no longer serving, fallback to highest serving
            const sortedServing = [...serving].sort((a, b) => b.noUrut - a.noUrut);
            latestCalledQueue = sortedServing[0];
        }

        prevServingQueues = [...serving];

        // Render Main Display (Latest Call)
        if (latestCalledQueue) {
            const numStr = String(latestCalledQueue.noUrut).padStart(3, '0');
            const adminId = latestCalledQueue.melayaniOleh;
            const counterInfo = countersData.find(c => c.id === adminId);
            const computerName = counterInfo ? counterInfo.name : 'Komputer -';
            
            // Animation trigger if changed
            if (prevServingNumber !== numStr) {
                currentNumberEl.classList.add('scale-110', 'text-orange-400');
                if(currentComputerEl) currentComputerEl.classList.add('scale-110', 'text-yellow-300');
                setTimeout(() => {
                    currentNumberEl.classList.remove('scale-110', 'text-orange-400');
                    if(currentComputerEl) currentComputerEl.classList.remove('scale-110', 'text-yellow-300');
                }, 500);

                // Play Voice Announcement
                if (prevServingNumber !== null) { // Only announce if not the initial load
                    speakQueue(numStr, computerName);
                }

                prevServingNumber = numStr;
            }

            currentNumberEl.textContent = numStr;
            if(currentComputerEl) {
                currentComputerEl.textContent = `Ke ${computerName}`;
                currentComputerEl.classList.remove('opacity-0');
            }
            currentNameEl.textContent = `Calon Murid: ${latestCalledQueue.namaMurid}`;
            currentNameEl.classList.remove('opacity-0');
        } else {
            currentNumberEl.textContent = '---';
            if(currentComputerEl) {
                currentComputerEl.textContent = 'Ke Komputer -';
                currentComputerEl.classList.add('opacity-0');
            }
            currentNameEl.textContent = 'Menunggu Panggilan...';
            prevServingNumber = null;
        }

        // Render 7 Counters Grid
        if (countersContainerEl) {
            countersContainerEl.innerHTML = '';
            countersData.forEach(counter => {
                const card = document.createElement('div');
                
                if (counter.state === 'istirahat') {
                    card.className = `bg-red-900/20 border border-red-800/50 rounded-xl p-2 sm:p-3 flex flex-col justify-center items-center transition-all duration-300`;
                    card.innerHTML = `
                        <div class="text-[10px] sm:text-xs text-red-500/70 font-semibold tracking-wider uppercase mb-0 sm:mb-1">${counter.name}</div>
                        <div class="text-sm sm:text-base font-bold text-red-500 mt-1 sm:mt-2 tracking-widest">ISTIRAHAT</div>
                    `;
                } else if (counter.queue) {
                    const numStr = String(counter.queue.noUrut).padStart(3, '0');
                    const isLatest = latestCalledQueue && latestCalledQueue.id === counter.queue.id;
                    
                    card.className = `bg-slate-800 border ${isLatest ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-slate-600'} rounded-xl p-2 sm:p-3 flex flex-col justify-center items-center transition-all duration-300`;
                    
                    card.innerHTML = `
                        <div class="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase mb-0 sm:mb-1">${counter.name}</div>
                        <div class="text-xl sm:text-2xl font-black text-white ${isLatest ? 'text-orange-400' : ''}">#${numStr}</div>
                    `;
                } else {
                    card.className = `bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 sm:p-3 flex flex-col justify-center items-center transition-all duration-300`;
                    card.innerHTML = `
                        <div class="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-wider uppercase mb-0 sm:mb-1">${counter.name}</div>
                        <div class="text-xl sm:text-2xl font-black text-slate-600">---</div>
                    `;
                }
                countersContainerEl.appendChild(card);
            });
        }

        // Waiting List (Next 5)
        const waiting = queues.filter(q => q.status === 'Menunggu');
        waitingCountEl.textContent = `${waiting.length} Menunggu`;

        waitingListEl.innerHTML = '';
        
        if (waiting.length === 0) {
            waitingListEl.innerHTML = '<div class="text-center text-slate-500 py-10">Belum ada antrian menunggu.</div>';
        } else {
            // Show up to 5 next queues
            const nextQueues = waiting.slice(0, 5);
            nextQueues.forEach(q => {
                const item = document.createElement('div');
                item.className = "bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center justify-between";
                item.innerHTML = `
                    <div>
                        <div class="text-sm text-slate-400 mb-1">Nomor Antrian</div>
                        <div class="text-3xl font-bold text-slate-200">#${String(q.noUrut).padStart(3, '0')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-yellow-500 font-medium">Menunggu</div>
                    </div>
                `;
                waitingListEl.appendChild(item);
            });
        }
    };

    // Load Data
    const loadData = () => {
        if (useMock) {
            mockDB.getCountersState((state) => {
                countersState = state || {};
                triggerRender();
            });
            mockDB.getQueues((data) => {
                globalQueues = data;
                triggerRender();
            });
        } else {
            const dateKey = getTodayDateString();
            
            // Listen to Counters State
            database.ref('counters_state').on('value', (snapshot) => {
                countersState = snapshot.val() || {};
                triggerRender();
            });

            // Listen to Queues
            database.ref(`queues/${dateKey}`).on('value', (snapshot) => {
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
                globalQueues = queuesArray;
                triggerRender();
            }, (error) => {
                console.error("Firebase Read Error:", error);
            });
        }
    };

    loadData();
});
