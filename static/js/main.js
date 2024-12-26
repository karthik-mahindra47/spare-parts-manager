// Global variables
let editingId = null;
let parts = [];

// Load parts on page load
document.addEventListener('DOMContentLoaded', fetchParts);

// Fetch all parts from the server
async function fetchParts() {
    try {
        const response = await fetch('/api/parts');
        parts = await response.json();
        renderPartsTable();
    } catch (error) {
        showAlert('Error fetching parts: ' + error.message, 'error');
    }
}

// Render the parts table
function renderPartsTable() {
    const tbody = document.getElementById('partsTable');
    tbody.innerHTML = '';

    parts.forEach(part => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 border">${part.sr_no}</td>
            <td class="p-3 border">${part.equipment}</td>
            <td class="p-3 border">${part.item_description}</td>
            <td class="p-3 border">${part.oem_part_number}</td>
            <td class="p-3 border">${part.oem}</td>
            <td class="p-3 border">${part.qty}</td>
            <td class="p-3 border">${part.igt_part_number}</td>
            <td class="p-3 border">${part.location}</td>
            <td class="p-3 border">${part.sublocation}</td>
            <td class="p-3 border">
                <div class="flex gap-2">
                    <button onclick="editPart(${part.id})" 
                            class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        Edit
                    </button>
                    <button onclick="usePart(${part.id})" 
                            class="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            ${part.qty <= 0 ? 'disabled' : ''}>
                        Use
                    </button>
                    <button onclick="deletePart(${part.id})" 
                            class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Show/hide the add/edit form
function showAddForm() {
    document.getElementById('partForm').classList.remove('hidden');
    document.getElementById('formTitle').textContent = 'Add New Part';
    clearForm();
}

function hideForm() {
    document.getElementById('partForm').classList.add('hidden');
    editingId = null;
    clearForm();
}

// Clear the form inputs
function clearForm() {
    const inputs = ['srNo', 'equipment', 'itemDescription', 'oemPartNumber', 
                   'oem', 'qty', 'igtPartNumber', 'location', 'sublocation'];
    inputs.forEach(id => document.getElementById(id).value = '');
}

// Save a part (create or update)
async function savePart() {
    const part = {
        sr_no: document.getElementById('srNo').value,
        equipment: document.getElementById('equipment').value,
        item_description: document.getElementById('itemDescription').value,
        oem_part_number: document.getElementById('oemPartNumber').value,
        oem: document.getElementById('oem').value,
        qty: parseInt(document.getElementById('qty').value) || 0,
        igt_part_number: document.getElementById('igtPartNumber').value,
        location: document.getElementById('location').value,
        sublocation: document.getElementById('sublocation').value
    };

    try {
        const url = editingId ? `/api/parts/${editingId}` : '/api/parts';
        const method = editingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(part)
        });

        if (!response.ok) throw new Error('Failed to save part');

        await fetchParts();
        hideForm();
        showAlert('Part saved successfully', 'success');
    } catch (error) {
        showAlert('Error saving part: ' + error.message, 'error');
    }
}

// Edit a part
function editPart(id) {
    const part = parts.find(p => p.id === id);
    if (!part) return;

    editingId = id;
    document.getElementById('formTitle').textContent = 'Edit Part';
    
    document.getElementById('srNo').value = part.sr_no;
    document.getElementById('equipment').value = part.equipment;
    document.getElementById('itemDescription').value = part.item_description;
    document.getElementById('oemPartNumber').value = part.oem_part_number;
    document.getElementById('oem').value = part.oem;
    document.getElementById('qty').value = part.qty;
    document.getElementById('igtPartNumber').value = part.igt_part_number;
    document.getElementById('location').value = part.location;
    document.getElementById('sublocation').value = part.sublocation;

    document.getElementById('partForm').classList.remove('hidden');
}

// Use a part (decrease quantity)
async function usePart(id) {
    const part = parts.find(p => p.id === id);
    if (!part || part.qty <= 0) return;

    try {
        const response = await fetch(`/api/parts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...part,
                qty: part.qty - 1
            })
        });

        if (!response.ok) throw new Error('Failed to update part');

        await fetchParts();
        showAlert('Part used successfully', 'success');
    } catch (error) {
        showAlert('Error using part: ' + error.message, 'error');
    }
}

// Delete a part
async function deletePart(id) {
    if (!confirm('Are you sure you want to delete this part?')) return;

    try {
        const response = await fetch(`/api/parts/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete part');

        await fetchParts();
        showAlert('Part deleted successfully', 'success');
    } catch (error) {
        showAlert('Error deleting part: ' + error.message, 'error');
    }
}

// Handle file upload
document.getElementById('fileUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload file');

        await fetchParts();
        showAlert('File uploaded successfully', 'success');
    } catch (error) {
        showAlert('Error uploading file: ' + error.message, 'error');
    }
});

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded shadow-lg ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        'bg-blue-500'
    } text-white`;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}