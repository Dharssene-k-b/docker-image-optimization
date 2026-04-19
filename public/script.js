// public/script.js
const API_BASE_URL = 'http://localhost:5005/api';
const AUTH_URL = `${API_BASE_URL}/users`;
const BMI_URL = `${API_BASE_URL}/bmi`;

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const calculatorSection = document.getElementById('calculator-section');
const profileSection = document.getElementById('profile-section');
const profileBtn = document.getElementById('profile-btn');
const logoutBtnProfile = document.getElementById('profile-logout-btn');
const goToCalcBtn = document.getElementById('go-to-calc-btn');
const forgotPasswordLink = document.getElementById('forgot-password');
const modal = document.getElementById('modal');
const modalCloseBtn = modal ? modal.querySelector('.close-btn') : null;
const sendResetBtn = document.getElementById('send-reset-btn');
const forgotMessage = document.getElementById('forgot-message');
const resetCalcBtn = document.getElementById('reset-btn');
const authBtn = document.getElementById('auth-btn'); 
const authMessage = document.getElementById('auth-message'); // FIXED: ReferenceError
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const heightUnitSelect = document.getElementById('height-unit');
const weightUnitSelect = document.getElementById('weight-unit');
const calculateBtn = document.getElementById('calculate-btn');
const calcMessage = document.getElementById('calc-message');
const historyList = document.getElementById('history-list'); // Detailed List element

// --- CHARTING VARIABLES ---
let bmiChart = null; 
const CHART_CTX = document.getElementById('bmiChart');


// --- CONSTANTS AND STATE ---
const RANGES = {
    height: {
        cm: { min: 50, max: 280, placeholder: 'e.g., 175 cm' },
        m: { min: 0.5, max: 2.8, placeholder: 'e.g., 1.75 m' },
        in: { min: 20, max: 110, placeholder: 'e.g., 68 in' }
    },
    weight: {
        kg: { min: 10, max: 300, placeholder: 'e.g., 70 kg' },
        lb: { min: 22, max: 660, placeholder: 'e.g., 154 lb' } ,
        st: { min: 1.5, max: 47, placeholder: 'e.g., 11 st' }
    }
};

let isLoginMode = true; 

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // --- EVENT LISTENERS ---
    if (authBtn) authBtn.addEventListener('click', handleAuth);
    const switchToSignup = document.getElementById('switch-to-signup');
    if (switchToSignup) switchToSignup.addEventListener('click', toggleAuthMode);
    if (profileBtn) profileBtn.addEventListener('click', showProfileView);
    if (logoutBtnProfile) logoutBtnProfile.addEventListener('click', logoutUser);
    if (goToCalcBtn) goToCalcBtn.addEventListener('click', showCalculatorView);
    if (heightUnitSelect) heightUnitSelect.addEventListener('change', updateInputLimits);
    if (weightUnitSelect) weightUnitSelect.addEventListener('change', updateInputLimits);
    if (calculateBtn) calculateBtn.addEventListener('click', handleCalculate);
    if (resetCalcBtn) resetCalcBtn.addEventListener('click', resetCalculatorFields); 
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', showModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
    if (sendResetBtn) sendResetBtn.addEventListener('click', handleForgotPassword);
    window.addEventListener('click', (event) => {
        if (event.target == modal) hideModal();
    });

    updateInputLimits(); 
    checkAuthStatus(); 
}

// --- VIEW MANAGEMENT ---

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        showCalculatorView(); 
        fetchHistory(); 
    } else {
        showAuthView(); 
    }
}

function showAuthView() {
    if (authSection) authSection.classList.remove('hidden');
    if (calculatorSection) calculatorSection.classList.add('hidden');
    if (profileSection) profileSection.classList.add('hidden');
    if (profileBtn) profileBtn.classList.add('hidden');
    if (!isLoginMode) {
        toggleAuthMode();
    }
}

function showCalculatorView() {
    if (authSection) authSection.classList.add('hidden');
    if (profileSection) profileSection.classList.add('hidden');
    if (calculatorSection) calculatorSection.classList.remove('hidden');
    if (profileBtn) profileBtn.classList.remove('hidden');
    fetchHistory();
}

function showProfileView() {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return logoutUser();

    document.getElementById('user-email-display').textContent = userEmail;

    if (authSection) authSection.classList.add('hidden');
    if (calculatorSection) calculatorSection.classList.add('hidden');
    if (profileSection) profileSection.classList.remove('hidden');
    if (profileBtn) profileBtn.classList.remove('hidden');
}


// --- UNIT & CALCULATOR LOGIC ---

function updateInputLimits() {
    if (!heightUnitSelect || !weightUnitSelect) return; 

    const hUnit = heightUnitSelect.value;
    const hRange = RANGES.height[hUnit];
    if (heightInput) {
        heightInput.min = hRange.min;
        heightInput.max = hRange.max;
        heightInput.placeholder = hRange.placeholder;
    }

    const wUnit = weightUnitSelect.value;
    const wRange = RANGES.weight[wUnit];
    if (weightInput) {
        weightInput.min = wRange.min;
        weightInput.max = wRange.max;
        weightInput.placeholder = wRange.placeholder;
    }
    
    resetCalculatorFields();
}

function convertToMetric(value, unit) {
    if (unit === 'in') return value * 2.54;
    if (unit === 'm') return value * 100;
    if (unit === 'lb') return value * 0.453592;
    if (unit === 'st') return value * 6.35029;
    return value; 
}

function resetCalculatorFields() {
    if (heightInput) heightInput.value = '';
    if (weightInput) weightInput.value = '';
    if (calcMessage) displayMessage(calcMessage, '', true); 
    displayResult('0.0', 'Awaiting data', 'initial-status');
}

// --- AUTHENTICATION LOGIC ---

function toggleAuthMode() {
    const authBtn = document.getElementById('auth-btn');
    const authTitle = document.getElementById('auth-title');
    const switchToSignup = document.getElementById('switch-to-signup');

    isLoginMode = !isLoginMode;
    if (authTitle) authTitle.textContent = isLoginMode ? 'Login to Your Account' : 'Create New Account';
    if (authBtn) {
        authBtn.textContent = isLoginMode ? 'Login' : 'Sign Up';
        authBtn.classList.toggle('primary-button', isLoginMode);
        authBtn.classList.toggle('success-button', !isLoginMode);
    }

    if (switchToSignup) {
        switchToSignup.innerHTML = isLoginMode 
            ? 'Don\'t have an account? Sign Up' 
            : 'Already have an account? Login';
    }
    
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    if (authMessage) displayMessage(authMessage, '', true); 
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (authMessage) displayMessage(authMessage, '', true); 

    if (!email || !password) {
        if (authMessage) displayMessage(authMessage, 'Email and password are required.', false);
        return;
    }
    const endpoint = isLoginMode ? 'login' : 'signup';
    try {
        const response = await fetch(`${AUTH_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            if (authMessage) displayMessage(authMessage, data.message || `Error during ${endpoint}.`, false);
            return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', email); 
        if (authMessage) displayMessage(authMessage, data.message, true); 
        setTimeout(() => {
            showCalculatorView();
        }, 800);
    } catch (error) {
        if (authMessage) displayMessage(authMessage, 'Network error: Could not connect to the server. Check your backend console.', false);
        console.error('Auth fetch error:', error);
    }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    showAuthView();
    resetCalculatorFields();
}

async function handleCalculate() {
    if (!heightInput || !weightInput || !heightUnitSelect || !weightUnitSelect || !calcMessage) return;

    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const hUnit = heightUnitSelect.value;
    const wUnit = weightUnitSelect.value;

    displayMessage(calcMessage, '', true);

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        displayMessage(calcMessage, 'Please enter valid positive numbers.', false);
        return;
    }
    
    const hRange = RANGES.height[hUnit];
    const wRange = RANGES.weight[wUnit];
    if (height < hRange.min || height > hRange.max) {
        displayMessage(calcMessage, `Height must be between ${hRange.min} and ${hRange.max} ${hUnit}.`, false);
        return;
    }
     if (weight < wRange.min || weight > wRange.max) {
        displayMessage(calcMessage, `Weight must be between ${wRange.min} and ${wRange.max} ${wUnit}.`, false);
        return;
    }

    const metricHeightCM = Math.round(convertToMetric(height, hUnit));
    const metricWeightKG = parseFloat(convertToMetric(weight, wUnit).toFixed(2));

    const token = localStorage.getItem('token');
    if (!token) {
        displayMessage(calcMessage, 'You must be logged in to save records.', false);
        showAuthView();
        return;
    }

    try {
        const response = await fetch(BMI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                weight: metricWeightKG, 
                height: metricHeightCM 
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            displayMessage(calcMessage, data.message || 'Error: Could not save BMI record.', false);
            if (response.status === 401) logoutUser();
            return;
        }

        displayResult(data.bmiValue, data.category);
        fetchHistory();
        displayMessage(calcMessage, 'BMI saved successfully!', true);

    } catch (error) {
        displayMessage(calcMessage, 'Network error while saving BMI.', false);
        console.error('BMI fetch error:', error);
    }
}

// --- HISTORY AND CHARTING LOGIC ---

async function fetchHistory() {
    if (historyList) historyList.innerHTML = '<li class="loading-item"><i class="fas fa-spinner fa-spin"></i> Loading records...</li>';
    
    const token = localStorage.getItem('token');
    if (!token) return; 

    try {
        const response = await fetch(BMI_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const records = await response.json();

        if (response.status === 401) {
            logoutUser(); 
            return;
        }
        
        // 1. Sort records by date (oldest first for chart, newest first for list)
        const sortedRecordsOldestFirst = records.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        if (historyList) historyList.innerHTML = ''; 

        if (records.length === 0) {
            if (historyList) historyList.innerHTML = '<li><i class="fas fa-search"></i> No past records found. Enter a measurement above!</li>';
            renderBmiChart([]); 
            return;
        }

        // 2. Render Detailed List (Newest first, so we reverse the sorted array)
        sortedRecordsOldestFirst.slice().reverse().forEach(record => { 
            const listItem = document.createElement('li');
            const date = new Date(record.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            const categoryClass = getCategoryClass(record.category);
            
            listItem.innerHTML = `
                <span>${date}</span>
                <span>${record.height}cm / ${record.weight}kg</span>
                <span class="bmi-history-text ${categoryClass}">
                    ${record.bmiValue} (${record.category})
                </span>
            `;
            if (historyList) historyList.appendChild(listItem);
        });

        // 3. Render Chart
        renderBmiChart(sortedRecordsOldestFirst);

    } catch (error) {
        if (historyList) historyList.innerHTML = '<li class="error-message"><i class="fas fa-times-circle"></i> Failed to load history.</li>';
        console.error('Fetch history error:', error);
    }
}

function getBackgroundColor(category) {
    const root = getComputedStyle(document.documentElement);
    switch (category) {
        case 'Underweight': return root.getPropertyValue('--bmi-underweight');
        case 'Normal Weight': return root.getPropertyValue('--bmi-normal');
        case 'Overweight': return root.getPropertyValue('--bmi-overweight');
        case 'Obese': return root.getPropertyValue('--bmi-obese');
        default: return root.getPropertyValue('--bmi-initial');
    }
}

function renderBmiChart(records) {
    if (!CHART_CTX) return;

    if (bmiChart) {
        bmiChart.destroy();
    }

    const data = {
        labels: records.map(r => new Date(r.createdAt).toLocaleDateString()),
        datasets: [{
            label: 'BMI Score',
            data: records.map(r => r.bmiValue),
            borderColor: 'rgba(0, 188, 212, 1)', 
            backgroundColor: records.map(r => getBackgroundColor(r.category) + '80'), 
            pointBorderColor: 'white',
            pointBackgroundColor: records.map(r => getBackgroundColor(r.category)),
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false, 
        scales: {
            y: {
                beginAtZero: false,
                title: { display: true, text: 'BMI Value', color: 'var(--text-light)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'var(--text-light)' }
            },
            x: {
                title: { display: true, text: 'Date', color: 'var(--text-light)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'var(--text-light)' }
            }
        },
        plugins: {
            legend: { display: true, labels: { color: 'var(--text-light)' } },
            title: { display: false }
        }
    };

    bmiChart = new Chart(CHART_CTX, {
        type: 'line',
        data: data,
        options: options
    });
}


// --- UTILITY FUNCTIONS ---

function displayMessage(element, message, isSuccess = false) {
    if (element) {
        element.textContent = message;
        element.className = 'message-text'; 
        if (isSuccess) {
            element.classList.add('success');
        } else {
            element.classList.add('error');
        }
    }
}

function displayResult(bmiValue, category, customClass = null) {
    const categoryElement = document.getElementById('category');
    const bmiDisplay = document.getElementById('bmi');

    if (bmiDisplay) bmiDisplay.textContent = bmiValue;
    if (categoryElement) {
        categoryElement.textContent = `Category: `;
        const span = document.createElement('span');
        span.textContent = category;
        span.className = customClass || getCategoryClass(category);
        categoryElement.appendChild(span);
    }
}

function getCategoryClass(category) {
    switch (category) {
        case 'Underweight': return 'underweight';
        case 'Normal Weight': return 'normal';
        case 'Overweight': return 'overweight';
        case 'Obese': return 'obese';
        default: return 'initial-status';
    }
}

// --- FORGOT PASSWORD MODAL LOGIC ---

function showModal() {
    if (modal) modal.classList.remove('hidden');
    const authEmail = document.getElementById('auth-email');
    const forgotEmail = document.getElementById('forgot-email');
    if (forgotEmail && authEmail) forgotEmail.value = authEmail.value; 
    if (forgotMessage) displayMessage(forgotMessage, '', true);
}

function hideModal() {
    if (modal) modal.classList.add('hidden');
    const forgotEmail = document.getElementById('forgot-email');
    if (forgotEmail) forgotEmail.value = '';
}

async function handleForgotPassword() {
    const email = document.getElementById('forgot-email').value;
    if (forgotMessage) displayMessage(forgotMessage, '', true);
    if (sendResetBtn) sendResetBtn.disabled = true;

    // Mock success response
    setTimeout(() => {
        if (sendResetBtn) sendResetBtn.disabled = false;
        if (forgotMessage) displayMessage(forgotMessage, 'Reset link successfully requested. Check your email.', true);
        setTimeout(hideModal, 3000); 
    }, 1000);
}