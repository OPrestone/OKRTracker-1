@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('check-ins.index') }}">Check-ins</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Check-in Details</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Check-in Details</h1>
            <p class="text-muted mb-0" id="checkin-date"></p>
        </div>
        <div class="col-md-4 text-md-end">
            <button type="button" id="delete-btn" class="btn btn-outline-danger">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Key Result</label>
                                <p id="checkin-key-result">-</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Objective</label>
                                <p id="checkin-objective">-</p>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Previous Value</label>
                                <p id="checkin-previous-value">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Current Value</label>
                                <p id="checkin-current-value">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Change</label>
                                <p id="checkin-change">-</p>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">User</label>
                                <p id="checkin-user">-</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Status</label>
                                <p id="checkin-status"><span class="badge bg-secondary">-</span></p>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <div class="mb-0">
                                <label class="form-label fw-bold">Note</label>
                                <p id="checkin-note">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Key Result Progress</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <div class="progress" style="height: 20px;">
                                <div id="progress-bar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Start Value</label>
                                <p id="kr-start-value">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Current Value</label>
                                <p id="kr-current-value">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Target Value</label>
                                <p id="kr-target-value">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">History</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Value</th>
                                    <th>Change</th>
                                    <th>Status</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody id="history-body">
                                <tr>
                                    <td colspan="6" class="text-center py-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="delete-confirm-modal" tabindex="-1" aria-labelledby="delete-confirm-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="delete-confirm-modal-label">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this check-in? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete</button>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    // Global variables
    let checkInId = {{ $id }};
    let checkIn = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load check-in data
        loadCheckIn();
        
        // Set up event listeners
        document.getElementById('delete-btn').addEventListener('click', function() {
            showDeleteConfirmation();
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    });
    
    function loadCheckIn() {
        fetch(`/api/check-ins/${checkInId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                checkIn = data.data;
                
                // Update the UI with check-in data
                document.getElementById('checkin-date').textContent = formatDate(checkIn.created_at);
                
                // Key Result and Objective
                if (checkIn.key_result) {
                    const keyResultLink = document.createElement('a');
                    keyResultLink.href = `/key-results/${checkIn.key_result_id}`;
                    keyResultLink.textContent = checkIn.key_result.title;
                    document.getElementById('checkin-key-result').innerHTML = '';
                    document.getElementById('checkin-key-result').appendChild(keyResultLink);
                    
                    if (checkIn.key_result.objective) {
                        const objectiveLink = document.createElement('a');
                        objectiveLink.href = `/objectives/${checkIn.key_result.objective_id}`;
                        objectiveLink.textContent = checkIn.key_result.objective.title;
                        document.getElementById('checkin-objective').innerHTML = '';
                        document.getElementById('checkin-objective').appendChild(objectiveLink);
                    } else {
                        document.getElementById('checkin-objective').textContent = '-';
                    }
                } else {
                    document.getElementById('checkin-key-result').textContent = '-';
                    document.getElementById('checkin-objective').textContent = '-';
                }
                
                // Values
                document.getElementById('checkin-previous-value').textContent = formatValue(checkIn.previous_value, checkIn.key_result ? checkIn.key_result.format : 'number');
                document.getElementById('checkin-current-value').textContent = formatValue(checkIn.current_value, checkIn.key_result ? checkIn.key_result.format : 'number');
                
                // Change
                const change = checkIn.current_value - checkIn.previous_value;
                const changeEl = document.createElement('span');
                
                if (change > 0) {
                    changeEl.className = 'text-success';
                    changeEl.textContent = '+' + formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
                } else if (change < 0) {
                    changeEl.className = 'text-danger';
                    changeEl.textContent = formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
                } else {
                    changeEl.textContent = 'No change';
                }
                
                document.getElementById('checkin-change').innerHTML = '';
                document.getElementById('checkin-change').appendChild(changeEl);
                
                // User
                document.getElementById('checkin-user').textContent = checkIn.user ? checkIn.user.name : '-';
                
                // Status
                const statusBadge = document.createElement('span');
                statusBadge.className = `badge bg-${getStatusColorClass(checkIn.status)}`;
                statusBadge.textContent = formatStatus(checkIn.status);
                document.getElementById('checkin-status').innerHTML = '';
                document.getElementById('checkin-status').appendChild(statusBadge);
                
                // Note
                document.getElementById('checkin-note').textContent = checkIn.note || 'No note provided.';
                
                // Key Result Progress
                if (checkIn.key_result) {
                    const kr = checkIn.key_result;
                    
                    document.getElementById('kr-start-value').textContent = formatValue(kr.start_value, kr.format);
                    document.getElementById('kr-current-value').textContent = formatValue(kr.current_value, kr.format);
                    document.getElementById('kr-target-value').textContent = formatValue(kr.target_value, kr.format);
                    
                    // Update progress bar
                    const progressBar = document.getElementById('progress-bar');
                    progressBar.style.width = `${kr.progress}%`;
                    progressBar.textContent = `${Math.round(kr.progress)}%`;
                    progressBar.className = `progress-bar bg-${getProgressColorClass(kr.progress)}`;
                    progressBar.setAttribute('aria-valuenow', kr.progress);
                }
                
                // Load check-in history
                loadCheckInHistory();
            } else {
                console.error('Error loading check-in:', data.message);
                alert('Error loading check-in. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error loading check-in:', error);
            alert('Error loading check-in. Please try again.');
        });
    }
    
    function loadCheckInHistory() {
        if (!checkIn || !checkIn.key_result_id) return;
        
        fetch(`/api/check-ins/by-key-result/${checkIn.key_result_id}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('history-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                // Sort check-ins by date (newest first)
                const checkIns = data.data.sort((a, b) => {
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                checkIns.forEach(historyCheckIn => {
                    const row = document.createElement('tr');
                    
                    // Highlight current check-in
                    if (historyCheckIn.id === checkIn.id) {
                        row.className = 'table-primary';
                    }
                    
                    // Date column
                    const dateCell = document.createElement('td');
                    const date = new Date(historyCheckIn.created_at);
                    dateCell.textContent = date.toLocaleString();
                    row.appendChild(dateCell);
                    
                    // User column
                    const userCell = document.createElement('td');
                    userCell.textContent = historyCheckIn.user ? historyCheckIn.user.name : '-';
                    row.appendChild(userCell);
                    
                    // Value column
                    const valueCell = document.createElement('td');
                    valueCell.textContent = formatValue(historyCheckIn.current_value, checkIn.key_result ? checkIn.key_result.format : 'number');
                    row.appendChild(valueCell);
                    
                    // Change column
                    const changeCell = document.createElement('td');
                    const change = historyCheckIn.current_value - historyCheckIn.previous_value;
                    const changeEl = document.createElement('span');
                    
                    if (change > 0) {
                        changeEl.className = 'text-success';
                        changeEl.textContent = '+' + formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
                    } else if (change < 0) {
                        changeEl.className = 'text-danger';
                        changeEl.textContent = formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
                    } else {
                        changeEl.textContent = 'No change';
                    }
                    
                    changeCell.appendChild(changeEl);
                    row.appendChild(changeCell);
                    
                    // Status column
                    const statusCell = document.createElement('td');
                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge bg-${getStatusColorClass(historyCheckIn.status)}`;
                    statusBadge.textContent = formatStatus(historyCheckIn.status);
                    statusCell.appendChild(statusBadge);
                    row.appendChild(statusCell);
                    
                    // Note column
                    const noteCell = document.createElement('td');
                    noteCell.textContent = historyCheckIn.note || '-';
                    row.appendChild(noteCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.className = 'text-center py-4';
                cell.textContent = 'No check-in history found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading check-in history:', error);
            
            const tableBody = document.getElementById('history-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading check-in history. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function showDeleteConfirmation() {
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        modal.show();
    }
    
    function confirmDelete() {
        fetch(`/api/check-ins/${checkInId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('delete-confirm-modal')).hide();
            
            if (data.success) {
                // Redirect to check-ins list
                window.location.href = '/check-ins';
            } else {
                console.error('Error deleting check-in:', data.message);
                alert('Error deleting check-in: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting check-in:', error);
            alert('Error deleting check-in. Please try again.');
        });
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString(undefined, options);
    }
    
    function formatValue(value, format) {
        if (value === null || value === undefined) return '-';
        
        switch (format) {
            case 'percentage':
                return value + '%';
            case 'currency':
                return '$' + value;
            case 'boolean':
                return value ? 'Yes' : 'No';
            case 'number':
            default:
                return value.toString();
        }
    }
    
    function formatStatus(status) {
        if (!status) return '';
        
        return status.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    function getStatusColorClass(status) {
        switch (status) {
            case 'not_started':
                return 'secondary';
            case 'in_progress':
                return 'primary';
            case 'at_risk':
                return 'warning';
            case 'completed':
                return 'success';
            case 'canceled':
                return 'danger';
            default:
                return 'secondary';
        }
    }
    
    function getProgressColorClass(progress) {
        if (progress >= 75) {
            return 'success';
        } else if (progress >= 50) {
            return 'info';
        } else if (progress >= 25) {
            return 'warning';
        } else {
            return 'danger';
        }
    }
</script>
@endsection