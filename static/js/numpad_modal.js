document.getElementById('orderNumber').addEventListener('click', function() {
    let myModal = new bootstrap.Modal(document.getElementById('numpadModal'));
    myModal.show();
});

function addNumber(num) {
    let input = document.getElementById('numpadInput');
    input.value += num;
}

function clearInput() {
    document.getElementById('numpadInput').value = '';
}

function confirmInput() {
    let numpadValue = document.getElementById('numpadInput').value;
    document.getElementById('orderNumber').value = numpadValue;
    let myModal = bootstrap.Modal.getInstance(document.getElementById('numpadModal'));
    myModal.hide();
    clearInput();
}