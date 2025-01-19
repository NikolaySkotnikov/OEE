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

function calculationOEE(data, typeDrum) {
    // Проверка на наличие конечного времени у последней записи
    if (data.length > 0 && !data[data.length - 1].end_time) {
        data[data.length - 1].end_time = new Date().toISOString();
    }


    // Время производства плановое
    let productionTime = 0;
    data.forEach(record => {
        if (record.drum_type === typeDrum && 
            record.status !== 'Непроизводственное время' && 
            record.status !== 'Согласованный простой') {
            const duration = (new Date(record.end_time) - new Date(record.start_time)) / (1000 * 60);
            productionTime += duration
        }
    })

    // Время производства фактическое и количество бочек
    let actualTime = 0;
    let totalDrum = 0; 
    data.forEach(record => {
        if (record.drum_type === typeDrum && record.status === 'В работе') {
            const duration = (new Date(record.end_time) - new Date(record.start_time)) / (1000 * 60);
            actualTime += duration;
            totalDrum += record.quantity;
        }
    })

    // Расчет коэфициентов OEE
    const availability = actualTime / productionTime;
    console.log(availability)
    let cycleTime = typeDrum === 'Закрытый верх' ? 6.67 : 5.33;
    console.log(cycleTime)
    console.log(productionTime, actualTime)
    console.log(totalDrum)
    const performance = totalDrum / (cycleTime * actualTime);

    // Расчет ОЕЕ
    const oee = availability * performance * 100;
    console.log(oee)
    if (totalDrum === 0) {
        oee = 0
    }

    return oee;
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

                let newOEEValue = calculationOEE(data, latestData.drum_type)
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
                document.getElementById('currentDrumCount').textContent = '-';
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
