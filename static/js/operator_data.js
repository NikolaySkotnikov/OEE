document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');

    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let status = '';
        if (document.getElementById('changeover').value) {
            status = document.getElementById('changeover').value;
        } else if (document.getElementById('consistent').value) {
            status = document.getElementById('consistent').value;
        } else if (document.getElementById('breaking').value) {
            status = document.getElementById('breaking').value;
        } else if (document.getElementById('nonproduction').value) {
            status = document.getElementById('nonproduction').value;
        }

        const formData = {
            order_number: document.getElementById('orderNumber').value,
            drum_type: document.getElementById('drumType').value,
            status: status,
        };

        const isAllEmpty = Object.values(formData).every(value => value === '');

        console.log(formData, isAllEmpty)
        
        if (isAllEmpty) {
            return;
        } else {
            fetch('/api/parametrs-order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (response.ok) {
                
                    const offcanvasElement = document.getElementById('staticBackdrop');
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                    offcanvas.hide();
                    
                    orderForm.reset();
                    
                    ['changeover', 'nonproduction', 'breaking', 'consistent'].forEach(id => {
                        document.getElementById(id).disabled = false;
                    });
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                });
            }
        });
    });