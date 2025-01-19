document.addEventListener('DOMContentLoaded', function() {
    const quickPeriodSelect = document.querySelector('select[name="quick_period"]');
    const customPeriodInputs = document.querySelectorAll('.custom-period input');
    const filterForm = document.querySelector('.filter-form');

    function toggleCustomPeriod() {
        const isCustomPeriod = quickPeriodSelect.value === '' || quickPeriodSelect.value === 'custom';
        
        customPeriodInputs.forEach(input => {
            input.disabled = !isCustomPeriod;
            if (!isCustomPeriod) {
                input.value = '';
            }
        });
    }

    function handleCustomInputChange() {
        const hasCustomValue = Array.from(customPeriodInputs).some(input => input.value !== '');
        if (hasCustomValue) {
            quickPeriodSelect.disabled = true;
            quickPeriodSelect.value = 'custom';
        } else {
            quickPeriodSelect.disabled = false;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(filterForm);
        const params = new URLSearchParams(formData);
    
        try {
            const response = await fetch(`/api/downtime-filter/?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            
            if (data && data.length > 0) {
                renderTimeline(data);
                renderTimeMarks(data);
                updateStatistics(data);
                const oeeValue = calculationOEE(data);
                displayOEE(oeeValue);
            } else {
                // Очищаем контейнеры при пустых данных
                document.getElementById('timeline-container').innerHTML = '';
                document.getElementById('time-axis').innerHTML = '';
                // Обнуляем статистику
                document.querySelector('.total-drums').textContent = '0';
                document.querySelector('.open-top-drums').textContent = '0';
                document.querySelector('.closed-top-drums').textContent = '0';
                document.querySelector('.oee-value').textContent = '-';
                document.querySelector('.oee-card').classList.remove('text-bg-danger', 'text-bg-warning', 'text-bg-success');
                document.querySelector('.oee-card').classList.add('text-bg-light');
            }
            
            console.log(data);
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    }

    quickPeriodSelect.addEventListener('change', toggleCustomPeriod);
    customPeriodInputs.forEach(input => {
        input.addEventListener('change', handleCustomInputChange);
    });
    filterForm.addEventListener('submit', handleFormSubmit);

    toggleCustomPeriod();
});

function renderTimeline(data) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    // Находим общую длительность периода
    const firstRecord = data[0];
    const lastRecord = data[data.length - 1];
    const totalDuration = new Date(lastRecord.end_time) - new Date(firstRecord.start_time);
    const containerWidth = container.offsetWidth;

    data.forEach(record => {
        const block = document.createElement('div');
        block.className = 'timeline-block';
        
        const startTime = new Date(record.start_time);
        const endTime = new Date(record.end_time);
        const duration = endTime - startTime;
        
        // Вычисляем позицию и ширину блока относительно контейнера
    
        const width = (duration / totalDuration) * containerWidth;
        
        block.style.width = `${width}px`;
        
        // Добавляем классы в зависимости от статуса
        switch(record.status) {
            case 'Непроизводственное время':
                block.classList.add('status-non-production-time');
                break;
            case 'В работе':
                block.classList.add('status-work');
                break;
            case 'Переналадка':
                block.classList.add('status-changeover');
                break;
            case 'Поломка':
                block.classList.add('status-breaking');
                break;
            case 'Согласованный простой':
                block.classList.add('status-consistent-simple');
                break;
            case 'Не присвоенный простой':
                block.classList.add('status-unassigned-downtime');
                break;
        }
        
        block.title = [
            `Статус: ${record.status}`,
            `Начало: ${startTime.toLocaleTimeString()}`,
            `Конец: ${endTime.toLocaleTimeString()}`,
            `Длит.: ${Math.floor((endTime - startTime) / 1000 / 60)} мин ${Math.floor(((endTime - startTime) / 1000) % 60)} сек`,
            `Заказ: ${record.order || 'Нет'}`,
            `Кол-во: ${record.quantity}`,
            `Тип: ${record.drum_type || 'Нет'}`,
            ...(['Непроизводственное время', 'Согласованный простой', 'Не присвоенный простой'].includes(record.status) ? [] : [`Причина: ${record.description || 'Не указана'}`])
        ].join('\n');
        
        container.appendChild(block);
    });
}

function renderTimeMarks(data) {
    const timeAxis = document.getElementById('time-axis');
    timeAxis.innerHTML = '';

    const firstRecord = data[0];
    const lastRecord = data[data.length - 1];
    const totalDuration = new Date(lastRecord.end_time) - new Date(firstRecord.start_time);
    const containerWidth = timeAxis.offsetWidth;
    
    let currentHour = new Date(firstRecord.start_time);
    currentHour.setMinutes(0, 0, 0);
    const endTime = new Date(lastRecord.end_time);
    
    while (currentHour <= endTime) {
        const timeMark = document.createElement('div');
        timeMark.className = 'time-mark';
        
        const offset = currentHour - new Date(firstRecord.start_time);
        const position = (offset / totalDuration) * containerWidth;
        
        // Проверяем, чтобы метка не выходила за пределы контейнера
        if (position >= 0 && position <= containerWidth - 40) {  // 40px - примерная ширина метки
            timeMark.style.left = `${position}px`;
            timeMark.textContent = currentHour.toLocaleTimeString().slice(0, 5);
            timeAxis.appendChild(timeMark);
        }
        
        currentHour = new Date(currentHour.getTime() + 60 * 60 * 1000);
    }
}

function updateStatistics(data) {
    let totalDrums = 0;
    let openTopDrums = 0;
    let closedTopDrums = 0;

    data.forEach(record => {
        if (record.status === 'В работе') {
            totalDrums += record.quantity;
            if (record.drum_type === 'Открытый верх') {
                openTopDrums += record.quantity;
            } else if (record.drum_type === 'Закрытый верх') {
                closedTopDrums += record.quantity;
            }
        }
    });

    document.querySelector('.total-drums').textContent = totalDrums;
    document.querySelector('.open-top-drums').textContent = openTopDrums;
    document.querySelector('.closed-top-drums').textContent = closedTopDrums;
}

function calculationOEE(data) {
    // Считаем ОЕЕ ЗВ
    const [oeeClosedTop, productionTimeClosedTop] = oee(data, 'Закрытый верх');

    // Считаем ОЕЕ ОВ
    const [oeeOpenTop, productionTimeOpenTop] = oee(data, 'Открытый верх');

    // Считаем среднее ОЕЕ
    const weightedOEE = ((oeeClosedTop * productionTimeClosedTop + oeeOpenTop * productionTimeOpenTop) / (productionTimeClosedTop + productionTimeOpenTop)).toFixed(1);
    console.log(weightedOEE)

    return weightedOEE;

}

function oee(data, typeDrum) {
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
        return[0, 0]
    }

    return [oee, productionTime]
}

function displayOEE(oeeValue) {
    const oeeCard = document.querySelector('.oee-card');
    const oeeText = document.querySelector('.oee-value');
    
    oeeText.textContent = `${oeeValue}%`;

    if (oeeValue < 80) {
        oeeCard.classList.remove('text-bg-light', 'text-bg-warning', 'text-bg-success');
        oeeCard.classList.add('text-bg-danger');
    } else if (oeeValue < 83) {
        oeeCard.classList.remove('text-bg-light', 'text-bg-danger', 'text-bg-success');
        oeeCard.classList.add('text-bg-warning');
    } else {
        oeeCard.classList.remove('text-bg-light', 'text-bg-danger', 'text-bg-warning');
        oeeCard.classList.add('text-bg-success');
    }
}
