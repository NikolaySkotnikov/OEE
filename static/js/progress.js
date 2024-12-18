function animateValue(start, end, duration, callback) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = +(start + range * progress).toFixed(1);
        callback(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateCircularOEE(value) {
    const normalizedValue = Math.min(value, 100);
    
    const circle = document.querySelector('.oee-circle');
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (normalizedValue / 100) * circumference;
    
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    document.querySelector('.oee-value').textContent = value.toFixed(1) + '%';
    
    if (value < 80) {
        circle.style.stroke = '#dc3545';
    } else if (value < 83) {
        circle.style.stroke = '#ffc107';
    } else {
        circle.style.stroke = '#28a745';
    }
}

function updateCircularCycle(value, drumType) {
    const maxCycleTime = drumType === 'Закрытый верх' ? 11 : 14;
    const normalizedValue = Math.min(value, maxCycleTime);
    
    const circle = document.querySelector('.cycle-circle');
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (normalizedValue / maxCycleTime) * circumference;
    
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    document.querySelector('.cycle-value').textContent = value.toFixed(1);
    
    if (drumType === 'Закрытый верх') {
        if (value > 10) {
            circle.style.stroke = '#dc3545';
        } else if (value > 9.5) {
            circle.style.stroke = '#ffc107';
        } else {
            circle.style.stroke = '#28a745';
        }
    } else {
        if (value > 12) {
            circle.style.stroke = '#dc3545';
        } else if (value > 11.5) {
            circle.style.stroke = '#ffc107';
        } else {
            circle.style.stroke = '#28a745';
        }
    }
}

function calculationOEE(data, quantity) {
    let totalDowntime = 0;

    let lastRecord = data[data.length - 1];
    if (lastRecord.status === 'В работе' && new Date(lastRecord.end_time) < new Date()) {
        lastRecord.end_time = new Date();
    }
    
    data.forEach(record => {
        if (record.status === 'Согласованный простой') {
            let endTime = record.end_time ? new Date(record.end_time) : new Date();
            let startTime = new Date(record.start_time);
            let downtimeMinutes = (endTime - startTime) / (1000 * 60);
            totalDowntime += downtimeMinutes;
        }
    });

    let orderEndTime = data[data.length - 1].end_time ? new Date(data[data.length - 1].end_time) : new Date();
    let orderStartTime = new Date(data[0].start_time);
    let totalOrderTime = (orderEndTime - orderStartTime) / (1000 * 60);

    let effectiveTime = totalOrderTime - totalDowntime;

    let productionRate = data[0].drum_type === 'Закрытый верх' ? 6.67 : 5.33;
    let oeeValue = (quantity / (effectiveTime * productionRate)) * 100;
    if (quantity < 2) {
        return 0;
    }
    return oeeValue;
}

function calculationCycleTime(data) {
    let totalWorkTime = 0;
    let totalQuantity = 0;

    data.forEach(record => {
        if (record.status === 'В работе') {
            let endTime = record.end_time ? new Date(record.end_time) : new Date();
            let startTime = new Date(record.start_time);
            let workTimeMinutes = (endTime - startTime) / 1000;
            totalWorkTime += workTimeMinutes;
            totalQuantity += record.quantity;
        }
    });

    return totalQuantity > 0 ? totalWorkTime / totalQuantity : 0;
}

let currentOEEValue = 0;
let currentCycleTime = 0;

let lastQuantity = 0;
let lastUpdateTime = Date.now();
let blinkInterval = null;

function stopBlinking() {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
        document.body.style.backgroundColor = '';
        console.log('Мигание остановлено');
    }
}

function checkProductionStatus(quantity, status) {
    const currentTime = Date.now();
    console.log('Текущий статус:', status);

    const stopBlinkingStatuses = [
        'Непроизводственное время',
        'Не присвоенный простой',
        'Согласованный простой',
        'Переналадка',
        'Поломка'
    ];

    if (stopBlinkingStatuses.includes(status)) {
        console.log(`Обнаружен статус "${status}" - останавливаем мигание`);
        stopBlinking();
        lastUpdateTime = currentTime;
        lastQuantity = quantity;
        return;
    }

    if (quantity === lastQuantity && quantity > 0 && status === 'В работе') {
        if (currentTime - lastUpdateTime >= 30000) {
            if (!blinkInterval) {
                blinkInterval = setInterval(() => {
                    document.body.style.backgroundColor = 
                        document.body.style.backgroundColor === 'rgba(255, 0, 0, 0.3)' ? '' : 'rgba(255, 0, 0, 0.3)';
                }, 1000);
            }
        }
    } else {
        stopBlinking();
        lastUpdateTime = currentTime;
    }
    
    lastQuantity = quantity;
}


function updateDashboardData() {
    fetch('/api/parametrs-order/')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latestData = data[data.length - 1];
                const totalQuantity = data.reduce((sum, record) => sum + record.quantity, 0);
                
                document.getElementById('currentOrderNumber').textContent = latestData.order;
                document.getElementById('currentDrumCount').textContent = totalQuantity;
                document.getElementById('currentDrumType').textContent = latestData.drum_type;
                document.getElementById('orderStatus').textContent = latestData.status;

                let newOEEValue = calculationOEE(data, totalQuantity)
                let newCycleTime = calculationCycleTime(data)

                animateValue(currentOEEValue, newOEEValue, 1000, updateCircularOEE);
                animateValue(currentCycleTime, newCycleTime, 1000, (value) => updateCircularCycle(value, latestData.drum_type))
                currentOEEValue = newOEEValue;
                currentCycleTime = newCycleTime;
                checkProductionStatus(totalQuantity, latestData.status);
            }

            else {
                stopBlinking()
                document.getElementById('currentOrderNumber').textContent = '-';
                document.getElementById('currentDrumCount').textContent = 0;
                document.getElementById('currentDrumType').textContent = '-';
                document.getElementById('orderStatus').textContent = 'Непроизводственное время';

                animateValue(currentOEEValue, 0, 1000, updateCircularOEE);
                animateValue(currentCycleTime, 0, 1000, updateCircularCycle);
                currentOEEValue = 0;
                currentCycleTime = 0;
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

updateDashboardData();
setInterval(updateDashboardData, 10000);
