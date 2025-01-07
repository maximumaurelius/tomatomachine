const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

let timeLeft = 25 * 60;
let timerId = null;
let isRunning = false;
let sessionsCompleted = 0;
let currentMode = 25;
let spinningDog = null;
let celebrationTimeout = null;
let currentTask = '';
let pomodoroLength = 25;
let shortBreakLength = 5;
let longBreakLength = 15;
let isDarkTheme = true;
let touchStartX = 0;
let touchEndX = 0;
let currentPage = 0;
let currentTheme = localStorage.getItem('theme') || 'light';

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const timeDisplay = document.getElementById('time');
    timeDisplay.textContent = timeString;
    document.title = `${timeString} - TOMATO MACHINE`;
    
    if (document.getElementById('progress')) {
        const totalTime = currentMode * 60;
        const progress = 100 - ((timeLeft / totalTime) * 100);
        document.getElementById('progress').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `${Math.round(progress)}%`;
        
        const dog = document.getElementById('spinning-dog');
        if (isRunning) {
            dog.classList.remove('hidden');
            dog.classList.remove('speed-1', 'speed-2', 'speed-3');
            if (progress > 75) {
                dog.classList.add('speed-3');
            } else if (progress > 50) {
                dog.classList.add('speed-2');
            } else {
                dog.classList.add('speed-1');
            }
        } else {
            dog.classList.add('hidden');
        }
        
        if (progress >= 95) {
            timeDisplay.classList.add('ending');
        } else {
            timeDisplay.classList.remove('ending');
        }
    }
}

function startTimer() {
    if (!isRunning) {
        if (currentMode === pomodoroLength) {
            showTaskPopup();
        } else {
            startTimerWithCurrentTask();
        }
    }
}

function showTaskPopup() {
    const popup = document.getElementById('task-popup');
    const input = document.getElementById('task-input');
    popup.style.display = 'flex';
    input.value = '';
    input.maxLength = 50;
    input.focus();

    document.addEventListener('keydown', handlePopupKeys);
    popup.addEventListener('click', handleOutsideClick);
    document.getElementById('task-input').addEventListener('input', updateCharCount);
}

function closeTaskPopup(shouldStartTimer = false) {
    const popup = document.getElementById('task-popup');
    popup.style.display = 'none';
    document.getElementById('task-input').value = '';
    
    document.removeEventListener('keydown', handlePopupKeys);
    popup.removeEventListener('click', handleOutsideClick);

    if (shouldStartTimer) {
        startTimerWithCurrentTask();
    }
}

function handlePopupKeys(e) {
    if (e.key === 'Enter') {
        startWithTask();
    } else if (e.key === 'Escape') {
        closeTaskPopup(true);
    }
}

function handleOutsideClick(e) {
    if (e.target.id === 'task-popup') {
        closeTaskPopup(true);
    }
}

function startWithTask() {
    const input = document.getElementById('task-input');
    const taskText = input.value.trim();
    
    if (!taskText) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }
    
    if (taskText.length > 50) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }
    
    const currentTask = document.getElementById('current-task');
    const title = document.querySelector('.bava-title');
    
    currentTask.textContent = `Focus: ${taskText}`;
    currentTask.classList.add('visible');
    title.classList.add('has-task');
    
    closeTaskPopup();
    startTimerWithCurrentTask();
}

function startTimerWithCurrentTask() {
    isRunning = true;
    document.getElementById('spinning-dog').classList.remove('hidden');
    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft === 0) {
            clearInterval(timerId);
            isRunning = false;
            document.getElementById('spinning-dog').classList.add('hidden');
            if (currentMode === pomodoroLength) {
                sessionsCompleted++;
                document.getElementById('sessions').textContent = sessionsCompleted;
                showCelebration();
                
                const currentTask = document.getElementById('current-task');
                const title = document.querySelector('.bava-title');
                currentTask.classList.remove('visible');
                title.classList.remove('has-task');
                setTimeout(() => {
                    currentTask.textContent = '';
                }, 300);
            }
            alarmSound.play();
            alert('Time is up!');
        }
    }, 1000);
}

function showCelebration() {
    const celebration = document.getElementById('celebration');
    celebration.classList.remove('hidden');
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
    celebrationTimeout = setTimeout(() => celebration.classList.add('hidden'), 2000);
}

function pauseTimer() {
    clearInterval(timerId);
    isRunning = false;
    document.getElementById('spinning-dog').classList.add('hidden');
}

function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    document.getElementById('spinning-dog').classList.add('hidden');
    timeLeft = currentMode * 60;
    updateDisplay();
}

function setTime(minutes) {
    clearInterval(timerId);
    isRunning = false;
    document.getElementById('spinning-dog').classList.add('hidden');
    
    if (minutes === 25) minutes = pomodoroLength;
    else if (minutes === 5) minutes = shortBreakLength;
    else if (minutes === 15) minutes = longBreakLength;
    
    currentMode = minutes;
    timeLeft = minutes * 60;
    currentTask = '';
    document.getElementById('current-task').textContent = '';
    updateDisplay();
}

function updateCharCount(e) {
    const count = e.target.value.length;
    document.getElementById('char-count').textContent = count;
}

function showSettingsPopup() {
    const popup = document.getElementById('settings-popup');
    popup.style.display = 'flex';
    
    document.getElementById('pomodoro-length').value = pomodoroLength;
    document.getElementById('short-break-length').value = shortBreakLength;
    document.getElementById('long-break-length').value = longBreakLength;
    
    document.addEventListener('keydown', handleSettingsKeys);
}

function closeSettingsPopup() {
    const popup = document.getElementById('settings-popup');
    popup.style.display = 'none';
    document.removeEventListener('keydown', handleSettingsKeys);
}

function handleSettingsKeys(e) {
    if (e.key === 'Escape') {
        closeSettingsPopup();
    }
}

function saveSettings() {
    const newPomodoro = parseInt(document.getElementById('pomodoro-length').value);
    const newShortBreak = parseInt(document.getElementById('short-break-length').value);
    const newLongBreak = parseInt(document.getElementById('long-break-length').value);
    
    if (newPomodoro < 1 || newShortBreak < 1 || newLongBreak < 1) {
        alert('All times must be at least 1 minute');
        return;
    }
    
    pomodoroLength = newPomodoro;
    shortBreakLength = newShortBreak;
    longBreakLength = newLongBreak;
    
    if (!isRunning) {
        if (currentMode === 25) currentMode = pomodoroLength;
        else if (currentMode === 5) currentMode = shortBreakLength;
        else if (currentMode === 15) currentMode = longBreakLength;
        timeLeft = currentMode * 60;
        updateDisplay();
    }
    
    closeSettingsPopup();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Cycle through themes: light -> dark -> rainforest -> light
    if (!document.body.className || document.body.className === 'theme-light') {
        document.body.className = 'theme-dark';
        themeIcon.textContent = '🌙';
    } else if (document.body.className === 'theme-dark') {
        document.body.className = 'theme-rainforest';
        themeIcon.textContent = '🌳';
    } else {
        document.body.className = 'theme-light';
        themeIcon.textContent = '☀️';
    }
    
    localStorage.setItem('theme', document.body.className);
}

function setTheme(theme) {
    isDarkTheme = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = isDarkTheme ? '🌙' : '☀️';
}

// Initialize display
updateDisplay(); 

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
initializeTheme(); 

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'theme-light';
    document.body.className = savedTheme;
    
    const themeIcon = document.querySelector('.theme-icon');
    if (savedTheme === 'theme-dark') {
        themeIcon.textContent = '🌙';
    } else if (savedTheme === 'theme-rainforest') {
        themeIcon.textContent = '🌳';
    } else {
        themeIcon.textContent = '☀️';
    }

    const primaryControls = document.querySelector('.primary-controls');
    const secondaryControls = document.querySelector('.secondary-controls');
    const dots = document.querySelectorAll('.dot');

    // Handle dot clicks
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => switchPage(index));
    });

    // Touch handling for swipe
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) < swipeThreshold) return;

        if (diff > 0 && currentPage === 0) {
            switchPage(1); // Swipe left
        } else if (diff < 0 && currentPage === 1) {
            switchPage(0); // Swipe right
        }
    }

    function switchPage(pageIndex) {
        currentPage = pageIndex;
        
        // Update controls visibility
        primaryControls.classList.toggle('active', pageIndex === 0);
        secondaryControls.classList.toggle('active', pageIndex === 1);
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === pageIndex);
        });
    }
}); 