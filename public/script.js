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
const authMessage = document.getElementById('auth-message');

const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const heightUnitSelect = document.getElementById('height-unit');
const weightUnitSelect = document.getElementById('weight-unit');
const calculateBtn = document.getElementById('calculate-btn');
const calcMessage = document.getElementById('calc-message');
const historyList = document.getElementById('history-list');

let bmiChart = null;
const CHART_CTX = document.getElementById('bmiChart');

let isLoginMode = true;

// --- INIT ---
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    authBtn?.addEventListener('click', handleAuth);
    document.getElementById('switch-to-signup')?.addEventListener('click', toggleAuthMode);
    profileBtn?.addEventListener('click', showProfileView);
    logoutBtnProfile?.addEventListener('click', logoutUser);
    goToCalcBtn?.addEventListener('click', showCalculatorView);
    heightUnitSelect?.addEventListener('change', updateInputLimits);
    weightUnitSelect?.addEventListener('change', updateInputLimits);
    calculateBtn?.addEventListener('click', handleCalculate);
    resetCalcBtn?.addEventListener('click', resetCalculatorFields);
    forgotPasswordLink?.addEventListener('click', showModal);
    modalCloseBtn?.addEventListener('click', hideModal);
    sendResetBtn?.addEventListener('click', handleForgotPassword);

    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    updateInputLimits();
    checkAuthStatus();
}

// --- AUTH CHECK ---
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    token ? showCalculatorView() : showAuthView();
}

// --- VIEWS ---
function showAuthView() {
    authSection?.classList.remove('hidden');
    calculatorSection?.classList.add('hidden');
    profileSection?.classList.add('hidden');
    profileBtn?.classList.add('hidden');
}

function showCalculatorView() {
    authSection?.classList.add('hidden');
    profileSection?.classList.add('hidden');
    calculatorSection?.classList.remove('hidden');
    profileBtn?.classList.remove('hidden');
    fetchHistory();
}

function showProfileView() {
    const email = localStorage.getItem('userEmail');
    if (!email) return logoutUser();

    document.getElementById('user-email-display').textContent = email;

    authSection?.classList.add('hidden');
    calculatorSection?.classList.add('hidden');
    profileSection?.classList.remove('hidden');
}

// --- AUTH ---
async function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        return displayMessage(authMessage, "Email & password required", false);
    }

    const endpoint = isLoginMode ? "login" : "signup";

    try {
        const res = await fetch(`${AUTH_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await safeJSON(res);

        if (!res.ok) {
            return displayMessage(authMessage, data.message || "Auth failed", false);
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", email);

        displayMessage(authMessage, "Success!", true);
        setTimeout(showCalculatorView, 800);

    } catch (err) {
        console.error(err);
        displayMessage(authMessage, "Server not reachable", false);
    }
}

function logoutUser() {
    localStorage.clear();
    showAuthView();
    resetCalculatorFields();
}

// --- BMI CALCULATE ---
async function handleCalculate() {
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);

    if (isNaN(height) || isNaN(weight)) {
        return displayMessage(calcMessage, "Enter valid values", false);
    }

    const token = localStorage.getItem("token");
    if (!token) return showAuthView();

    try {
        const res = await fetch(BMI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ height, weight })
        });

        const data = await safeJSON(res);

        if (!res.ok) {
            return displayMessage(calcMessage, data.message || "Error", false);
        }

        displayResult(data.bmiValue, data.category);
        fetchHistory();
        displayMessage(calcMessage, "Saved!", true);

    } catch (err) {
        console.error(err);
        displayMessage(calcMessage, "Server error", false);
    }
}

// --- HISTORY ---
async function fetchHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(BMI_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const records = await safeJSON(res);

        historyList.innerHTML = "";

        if (!Array.isArray(records) || records.length === 0) {
            historyList.innerHTML = "<li>No records</li>";
            return;
        }

        records.forEach(r => {
            const li = document.createElement("li");
            li.textContent = `${r.bmiValue} - ${r.category}`;
            historyList.appendChild(li);
        });

    } catch (err) {
        console.error(err);
    }
}

// --- UTILS ---
async function safeJSON(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

function displayMessage(el, msg, ok) {
    if (!el) return;
    el.textContent = msg;
    el.className = ok ? "success" : "error";
}

function displayResult(bmi, category) {
    document.getElementById("bmi").textContent = bmi;
    document.getElementById("category").textContent = category;
}

function resetCalculatorFields() {
    heightInput.value = "";
    weightInput.value = "";
}

// --- MODAL ---
function showModal() {
    modal?.classList.remove("hidden");
}

function hideModal() {
    modal?.classList.add("hidden");
}

function handleForgotPassword() {
    displayMessage(forgotMessage, "Reset link sent", true);
}

// --- UNIT ---
function updateInputLimits() {}
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
}