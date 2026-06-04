document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
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
            // Re-initialize audio context if needed
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Reset any stuck speech
                const utterance = new SpeechSynthesisUtterance('Suara aktif');
                utterance.lang = 'id-ID';
                utterance.volume = 1.0;
                window.speechSynthesis.speak(utterance);
            }
            audioOverlay.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => audioOverlay.remove(), 300);
        });
    }

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Manual Voice Test Function (can be called from console)
    window.testVoice = () => {
        speakQueue("000", "Komputer Percobaan");
    };

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

    const countersContainerEl = document.getElementById('counters-container');

    // State for animations and latest call
    let prevCallId = null;
    let prevCallTimestamp = null;
    let latestCalledQueue = null;
    let isInitialLoad = true;
    
    // Global Data Store
    let globalQueues = [];
    let countersState = {};

    const speakQueue = (numberStr, computerName) => {
        if (!('speechSynthesis' in window)) {
            console.error("Speech Synthesis tidak didukung di browser ini.");
            return;
        }
        
        // We do not cancel ongoing speech so that concurrent calls are queued and announced sequentially
        // window.speechSynthesis.cancel();

        const digitMap = {
            '0': 'nol', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat',
            '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'delapan', '9': 'sembilan'
        };
        const spelledNumber = numberStr.split('').map(d => digitMap[d] || d).join(' ');
        const text = `Antrian, nomor, ${spelledNumber}, ke, ${computerName}`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Ensure Indonesian voice
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Try fetching voices again if not loaded
            voices = window.speechSynthesis.getVoices();
        }
        
        const idVoice = voices.find(v => v.lang.includes('id') || v.name.includes('Indonesian') || v.name.includes('Google Bahasa Indonesia'));
        if (idVoice) {
            utterance.voice = idVoice;
        } else {
            console.warn("Suara Bahasa Indonesia tidak ditemukan, menggunakan suara default.");
        }
        
        window.speechUtterances.push(utterance);
        if (window.speechUtterances.length > 5) window.speechUtterances.shift();

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

        // Determine Latest Called Queue for Main Display (Based on latest timestamp)
        if (serving.length > 0) {
            // Sort by lastCalledAt (descending) to find the most recently called
            const sortedByCallTime = [...serving].sort((a, b) => {
                const timeA = a.lastCalledAt || 0;
                const timeB = b.lastCalledAt || 0;
                if (timeA !== timeB) return timeB - timeA;
                return b.noUrut - a.noUrut; // Fallback to queue number
            });
            latestCalledQueue = sortedByCallTime[0];
        } else {
            latestCalledQueue = null;
        }

        prevServingQueues = [...serving];

        // Render Main Display (Latest Call) logic is removed. 
        // We now handle it entirely in the 7 Counters Grid.

        if (countersContainerEl) {
            countersContainerEl.innerHTML = '';
            countersData.forEach(counter => {
                const card = document.createElement('div');
                
                if (counter.state === 'istirahat') {
                    card.className = `bg-red-900/20 border border-red-800/50 rounded-2xl p-4 xl:p-6 flex flex-col justify-center items-center transition-all duration-300 h-full w-full shadow-inner`;
                    card.innerHTML = `
                        <div class="text-sm md:text-lg xl:text-xl text-red-500/70 font-semibold tracking-wider uppercase">${counter.name}</div>
                        <div class="text-2xl md:text-3xl xl:text-4xl font-bold text-red-500 mt-4 tracking-widest">ISTIRAHAT</div>
                    `;
                } else if (counter.queue) {
                    const numStr = String(counter.queue.noUrut).padStart(3, '0');
                    const callId = counter.queue.id;
                    const callTimestamp = counter.queue.lastCalledAt || 0;
                    
                    let isJustCalled = false;
                    const isLatestGlobal = latestCalledQueue && latestCalledQueue.id === callId;

                    if (isLatestGlobal && (prevCallId !== callId || prevCallTimestamp !== callTimestamp)) {
                        isJustCalled = true;
                        
                        // Play Voice Announcement
                        if (!isInitialLoad) { 
                            speakQueue(numStr, counter.name);
                        }
                    }
                    
                    const baseClass = "rounded-2xl p-4 xl:p-6 flex flex-col justify-between items-center transition-all duration-500 h-full w-full relative overflow-hidden";
                    
                    if (isJustCalled) {
                        card.className = `${baseClass} bg-slate-700 border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)] scale-[1.03] z-10`;
                    } else if (isLatestGlobal) {
                        card.className = `${baseClass} bg-slate-800 border-2 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]`;
                    } else {
                        card.className = `${baseClass} bg-slate-800/80 border border-slate-600 shadow-lg`;
                    }
                    
                    card.innerHTML = `
                        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none"></div>
                        <div class="text-sm md:text-lg xl:text-xl text-slate-400 font-semibold tracking-wider uppercase relative z-10">${counter.name}</div>
                        <div class="text-5xl md:text-[4rem] xl:text-[5rem] font-black text-white relative z-10 my-2 xl:my-4 ${isLatestGlobal ? 'text-orange-400 drop-shadow-lg' : ''}">#${numStr}</div>
                        <div class="text-xl md:text-2xl xl:text-3xl font-bold text-yellow-400 truncate w-full text-center capitalize relative z-10 px-2" title="${counter.queue.namaMurid}">${counter.queue.namaMurid}</div>
                    `;
                    
                    if (isJustCalled) {
                        setTimeout(() => {
                            card.classList.remove('scale-[1.03]', 'shadow-[0_0_30px_rgba(249,115,22,0.6)]', 'bg-slate-700');
                            card.classList.add('bg-slate-800', 'shadow-[0_0_15px_rgba(249,115,22,0.2)]');
                        }, 2000); // 2 seconds highlight
                    }
                } else {
                    card.className = `bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 xl:p-6 flex flex-col justify-center items-center transition-all duration-300 h-full w-full`;
                    card.innerHTML = `
                        <div class="text-sm md:text-lg xl:text-xl text-slate-500 font-semibold tracking-wider uppercase">${counter.name}</div>
                        <div class="text-4xl xl:text-5xl font-black text-slate-700 mt-4">---</div>
                    `;
                }
                countersContainerEl.appendChild(card);
            });
        }

        // Update Global State for animations
        if (latestCalledQueue) {
            prevCallId = latestCalledQueue.id;
            prevCallTimestamp = latestCalledQueue.lastCalledAt || 0;
            isInitialLoad = false;
        } else {
            prevCallId = null;
            prevCallTimestamp = null;
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
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <div class="text-sm text-slate-400 uppercase tracking-wider font-semibold">Antrian #${String(q.noUrut).padStart(3, '0')}</div>
                            <div class="text-yellow-500 font-medium text-xs bg-yellow-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Menunggu</div>
                        </div>
                        <div class="text-xl font-bold text-slate-200 truncate capitalize" title="${q.namaMurid}">${q.namaMurid}</div>
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
