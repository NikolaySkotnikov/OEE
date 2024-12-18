const selects = ['changeover', 'nonproduction', 'breaking', 'consistent'];
    
    selects.forEach(selectId => {
        document.getElementById(selectId).addEventListener('change', function() {
            if (this.value) {
                selects.forEach(id => {
                    if (id !== selectId) {
                        document.getElementById(id).value = '';
                        document.getElementById(id).disabled = true;
                    }
                });
            } else {
                selects.forEach(id => {
                    document.getElementById(id).disabled = false;
                });
            }
        });
    });