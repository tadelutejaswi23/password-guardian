document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const entropyGaugeCtx = document.getElementById('entropyGauge').getContext('2d');
    const entropyValueSpan = document.getElementById('entropyValue');
    const breachResult = document.getElementById('breachResult');
    const suggestionsDiv = document.getElementById('suggestions');
    const checkBreachBtn = document.getElementById('checkBreach');

    let gaugeChart = new Chart(entropyGaugeCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 128],
                backgroundColor: ['#4dff4d', '#333'],
                borderWidth: 0,
                circumference: 270,
                rotation: 225,
            }]
        },
        options: {
            cutout: '75%',
            plugins: { tooltip: { enabled: false }, legend: { display: false } },
            responsive: false,
        }
    });

    passwordInput.addEventListener('input', async () => {
        const password = passwordInput.value;
        if (!password) { resetUI(); return; }
        try {
            const response = await fetch('/strength', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            updateStrength(data);
        } catch (err) { console.error(err); }
    });

    checkBreachBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        if (!password) return;
        breachResult.textContent = 'Checking...';
        try {
            const response = await fetch('/breach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();
            if (data.breached) {
                breachResult.innerHTML = `Found in ${data.count.toLocaleString()} data breaches!`;
                breachResult.style.color = '#ff4d4d';
            } else {
                breachResult.innerHTML = '✅ Not found in any known breach.';
                breachResult.style.color = '#4dff4d';
                if (strengthFill.style.width === '100%') {
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }
            }
        } catch (err) { breachResult.textContent = 'Error checking breach.'; }
    });

    function updateStrength(data) {
        const { score, entropy, feedback } = data;
        let widthPercent = (score / 4) * 100;
        strengthFill.style.width = `${widthPercent}%`;
        const colors = ['#ff4d4d', '#ff884d', '#ffbb33', '#b3ff4d', '#4dff4d'];
        strengthFill.style.background = colors[score];
        const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        strengthText.textContent = labels[score];
        let entropyBits = Math.min(128, entropy || 0).toFixed(0);
        entropyValueSpan.textContent = `${entropyBits} bits`;
        gaugeChart.data.datasets[0].data = [entropyBits, 128 - entropyBits];
        gaugeChart.data.datasets[0].backgroundColor = [colors[score], '#333'];
        gaugeChart.update();
        suggestionsDiv.innerHTML = feedback.map(s => `• ${s}`).join('<br>');
        if (score === 4) { confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } }); }
    }

    function resetUI() {
        strengthFill.style.width = '0%';
        strengthText.textContent = 'Type to see strength';
        entropyValueSpan.textContent = '0 bits';
        gaugeChart.data.datasets[0].data = [0, 128];
        gaugeChart.update();
        breachResult.innerHTML = '';
        suggestionsDiv.innerHTML = '';
    }
});