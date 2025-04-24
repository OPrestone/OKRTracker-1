<?php $__env->startSection('content'); ?>
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="<?php echo e(route('objectives.index')); ?>">Objectives</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Objective Details</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-8">
            <h1 id="objective-title">Loading objective...</h1>
            <p class="text-muted mb-0" id="objective-timeframe"></p>
        </div>
        <div class="col-md-4 text-md-end">
            <div class="btn-group" role="group">
                <a href="#" id="edit-btn" class="btn btn-outline-primary">
                    <i class="fas fa-edit"></i> Edit
                </a>
                <button type="button" id="delete-btn" class="btn btn-outline-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12 mb-4">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <label class="form-label">Progress</label>
                                    <div class="progress" style="height: 20px;">
                                        <div id="progress-bar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                                    </div>
                                </div>
                                <div class="ms-3">
                                    <span id="status-badge" class="badge bg-secondary">Not Started</span>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Team</label>
                                <p id="objective-team">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Owner</label>
                                <p id="objective-owner">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Level</label>
                                <p id="objective-level">-</p>
                            </div>
                        </div>

                        <div class="col-md-12">
                            <div class="mb-0">
                                <label class="form-label fw-bold">Description</label>
                                <p id="objective-description" class="mb-0">-</p>
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
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Key Results</h5>
                    <button type="button" class="btn btn-sm btn-primary" id="add-key-result-btn">
                        <i class="fas fa-plus"></i> Add Key Result
                    </button>
                </div>
                <div class="card-body p-0">
                    <div id="key-results-container">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
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
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Recent Check-ins</h5>
                    <a href="#" id="view-all-checkins-btn" class="btn btn-sm btn-outline-primary">
                        View All
                    </a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Key Result</th>
                                    <th>User</th>
                                    <th>Value</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody id="checkins-body">
                                <tr>
                                    <td colspan="5" class="text-center py-4">
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

<!-- Key Result Template -->
<template id="key-result-template">
    <div class="key-result-item border-bottom">
        <div class="p-3">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h5 class="key-result-title mb-1">Key Result Title</h5>
                    <p class="key-result-description text-muted mb-0">Description</p>
                </div>
                <div class="col-md-4">
                    <div class="progress" style="height: 10px;">
                        <div class="key-result-progress progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small class="key-result-start">0</small>
                        <small class="key-result-current text-primary">0</small>
                        <small class="key-result-target">0</small>
                    </div>
                </div>
                <div class="col-md-2 text-end">
                    <div class="d-flex justify-content-end">
                        <span class="key-result-status badge bg-secondary me-2">Not Started</span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item checkin-btn" href="#"><i class="fas fa-check"></i> Check-in</a></li>
                                <li><a class="dropdown-item edit-key-result-btn" href="#"><i class="fas fa-edit"></i> Edit</a></li>
                                <li><a class="dropdown-item initiatives-btn" href="#"><i class="fas fa-tasks"></i> Initiatives</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item delete-key-result-btn text-danger" href="#"><i class="fas fa-trash"></i> Delete</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<!-- Add Key Result Modal -->
<div class="modal fade" id="add-key-result-modal" tabindex="-1" aria-labelledby="add-key-result-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="add-key-result-modal-label">Add Key Result</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="add-key-result-form">
                    <div class="mb-3">
                        <label for="key-result-title" class="form-label">Title</label>
                        <input type="text" class="form-control" id="key-result-title" required>
                    </div>
                    <div class="mb-3">
                        <label for="key-result-description" class="form-label">Description</label>
                        <textarea class="form-control" id="key-result-description" rows="3"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="key-result-start-value" class="form-label">Start Value</label>
                                <input type="number" class="form-control" id="key-result-start-value" value="0">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="key-result-current-value" class="form-label">Current Value</label>
                                <input type="number" class="form-control" id="key-result-current-value" value="0">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="key-result-target-value" class="form-label">Target Value</label>
                                <input type="number" class="form-control" id="key-result-target-value" required>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="key-result-format" class="form-label">Format</label>
                        <select class="form-select" id="key-result-format" required>
                            <option value="number">Number</option>
                            <option value="percentage">Percentage</option>
                            <option value="currency">Currency</option>
                            <option value="boolean">Boolean (Yes/No)</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-key-result-btn">Save</button>
            </div>
        </div>
    </div>
</div>

<!-- Check-in Modal -->
<div class="modal fade" id="checkin-modal" tabindex="-1" aria-labelledby="checkin-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="checkin-modal-label">Check-in</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="checkin-form">
                    <input type="hidden" id="checkin-key-result-id">
                    <div class="mb-3">
                        <label for="checkin-key-result-title" class="form-label">Key Result</label>
                        <input type="text" class="form-control" id="checkin-key-result-title" readonly>
                    </div>
                    <div class="mb-3">
                        <label for="checkin-previous-value" class="form-label">Previous Value</label>
                        <input type="text" class="form-control" id="checkin-previous-value" readonly>
                    </div>
                    <div class="mb-3">
                        <label for="checkin-current-value" class="form-label">Current Value</label>
                        <input type="number" class="form-control" id="checkin-current-value" required>
                    </div>
                    <div class="mb-3">
                        <label for="checkin-status" class="form-label">Status</label>
                        <select class="form-select" id="checkin-status" required>
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="at_risk">At Risk</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="checkin-note" class="form-label">Note</label>
                        <textarea class="form-control" id="checkin-note" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-checkin-btn">Save</button>
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
                <p id="delete-confirm-message">Are you sure you want to delete this item?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete</button>
            </div>
        </div>
    </div>
</div>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
<script>
    // Global variables
    let objectiveId = <?php echo e($id); ?>;
    let objective = null;
    let keyResults = [];
    let deleteType = '';
    let deleteId = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load objective data
        loadObjective();
        
        // Load check-ins
        loadCheckIns();
        
        // Set up event listeners
        document.getElementById('add-key-result-btn').addEventListener('click', showAddKeyResultModal);
        document.getElementById('save-key-result-btn').addEventListener('click', saveKeyResult);
        document.getElementById('save-checkin-btn').addEventListener('click', saveCheckIn);
        document.getElementById('delete-btn').addEventListener('click', function() {
            showDeleteConfirmation('objective', objectiveId);
        });
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
        
        // Set up event delegation for dynamically created elements
        document.addEventListener('click', function(e) {
            // Check-in button
            if (e.target.closest('.checkin-btn')) {
                e.preventDefault();
                const keyResultItem = e.target.closest('.key-result-item');
                const keyResultId = keyResultItem.dataset.id;
                const keyResult = keyResults.find(kr => kr.id == keyResultId);
                showCheckInModal(keyResult);
            }
            
            // Edit key result button
            if (e.target.closest('.edit-key-result-btn')) {
                e.preventDefault();
                const keyResultItem = e.target.closest('.key-result-item');
                const keyResultId = keyResultItem.dataset.id;
                const keyResult = keyResults.find(kr => kr.id == keyResultId);
                // TODO: Implement edit key result functionality
                alert('Edit key result: ' + keyResult.title);
            }
            
            // Initiatives button
            if (e.target.closest('.initiatives-btn')) {
                e.preventDefault();
                const keyResultItem = e.target.closest('.key-result-item');
                const keyResultId = keyResultItem.dataset.id;
                // TODO: Implement initiatives view
                window.location.href = `/key-results/${keyResultId}/initiatives`;
            }
            
            // Delete key result button
            if (e.target.closest('.delete-key-result-btn')) {
                e.preventDefault();
                const keyResultItem = e.target.closest('.key-result-item');
                const keyResultId = keyResultItem.dataset.id;
                const keyResult = keyResults.find(kr => kr.id == keyResultId);
                showDeleteConfirmation('keyResult', keyResultId, keyResult.title);
            }
        });
    });
    
    function loadObjective() {
        fetch(`/api/objectives/${objectiveId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                objective = data.data;
                
                // Update the UI with objective data
                document.getElementById('objective-title').textContent = objective.title;
                document.getElementById('objective-description').textContent = objective.description || 'No description provided.';
                document.getElementById('objective-timeframe').textContent = objective.timeframe ? objective.timeframe.name : '';
                document.getElementById('objective-team').textContent = objective.team ? objective.team.name : '-';
                document.getElementById('objective-owner').textContent = objective.owner ? objective.owner.name : '-';
                document.getElementById('objective-level').textContent = formatLevel(objective.level);
                
                // Update progress bar
                const progressBar = document.getElementById('progress-bar');
                progressBar.style.width = `${objective.progress}%`;
                progressBar.textContent = `${Math.round(objective.progress)}%`;
                progressBar.classList.add(`bg-${getProgressColorClass(objective.progress)}`);
                progressBar.setAttribute('aria-valuenow', objective.progress);
                
                // Update status badge
                const statusBadge = document.getElementById('status-badge');
                statusBadge.textContent = formatStatus(objective.status);
                statusBadge.className = `badge bg-${getStatusColorClass(objective.status)}`;
                
                // Update edit button link
                document.getElementById('edit-btn').href = `/objectives/${objectiveId}/edit`;
                
                // Update view all check-ins button link
                document.getElementById('view-all-checkins-btn').href = `/objectives/${objectiveId}/check-ins`;
                
                // Render key results
                renderKeyResults(objective.key_results);
            } else {
                console.error('Error loading objective:', data.message);
                alert('Error loading objective. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error loading objective:', error);
            alert('Error loading objective. Please try again.');
        });
    }
    
    function loadCheckIns() {
        fetch(`/api/check-ins/by-objective/${objectiveId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('checkins-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                // Show only the first 5 check-ins
                const checkIns = data.data.slice(0, 5);
                
                checkIns.forEach(checkIn => {
                    const row = document.createElement('tr');
                    
                    // Date column
                    const dateCell = document.createElement('td');
                    const date = new Date(checkIn.created_at);
                    dateCell.textContent = date.toLocaleString();
                    row.appendChild(dateCell);
                    
                    // Key Result column
                    const krCell = document.createElement('td');
                    krCell.textContent = checkIn.key_result ? checkIn.key_result.title : '-';
                    row.appendChild(krCell);
                    
                    // User column
                    const userCell = document.createElement('td');
                    userCell.textContent = checkIn.user ? checkIn.user.name : '-';
                    row.appendChild(userCell);
                    
                    // Value column
                    const valueCell = document.createElement('td');
                    valueCell.innerHTML = `<span class="text-success">${checkIn.current_value}</span> <small class="text-muted">(was ${checkIn.previous_value})</small>`;
                    row.appendChild(valueCell);
                    
                    // Note column
                    const noteCell = document.createElement('td');
                    noteCell.textContent = checkIn.note || '-';
                    row.appendChild(noteCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.className = 'text-center py-4';
                cell.textContent = 'No check-ins found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading check-ins:', error);
            
            const tableBody = document.getElementById('checkins-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading check-ins. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function renderKeyResults(keyResultsData) {
        keyResults = keyResultsData || [];
        const container = document.getElementById('key-results-container');
        container.innerHTML = '';
        
        if (keyResults.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center py-4';
            emptyMessage.textContent = 'No key results found. Add your first key result to get started.';
            container.appendChild(emptyMessage);
            return;
        }
        
        keyResults.forEach(keyResult => {
            const template = document.getElementById('key-result-template');
            const clone = document.importNode(template.content, true);
            const item = clone.querySelector('.key-result-item');
            
            // Set data attribute for key result ID
            item.dataset.id = keyResult.id;
            
            // Update key result details
            clone.querySelector('.key-result-title').textContent = keyResult.title;
            clone.querySelector('.key-result-description').textContent = keyResult.description || 'No description provided.';
            
            // Update progress bar
            const progressBar = clone.querySelector('.key-result-progress');
            progressBar.style.width = `${keyResult.progress}%`;
            progressBar.classList.add(`bg-${getProgressColorClass(keyResult.progress)}`);
            progressBar.setAttribute('aria-valuenow', keyResult.progress);
            
            // Update values
            clone.querySelector('.key-result-start').textContent = formatValue(keyResult.start_value, keyResult.format);
            clone.querySelector('.key-result-current').textContent = formatValue(keyResult.current_value, keyResult.format);
            clone.querySelector('.key-result-target').textContent = formatValue(keyResult.target_value, keyResult.format);
            
            // Update status badge
            const statusBadge = clone.querySelector('.key-result-status');
            statusBadge.textContent = formatStatus(keyResult.status);
            statusBadge.className = `key-result-status badge bg-${getStatusColorClass(keyResult.status)}`;
            
            container.appendChild(clone);
        });
    }
    
    function showAddKeyResultModal() {
        // Reset form
        document.getElementById('add-key-result-form').reset();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('add-key-result-modal'));
        modal.show();
    }
    
    function saveKeyResult() {
        const title = document.getElementById('key-result-title').value;
        const description = document.getElementById('key-result-description').value;
        const startValue = parseFloat(document.getElementById('key-result-start-value').value);
        const currentValue = parseFloat(document.getElementById('key-result-current-value').value);
        const targetValue = parseFloat(document.getElementById('key-result-target-value').value);
        const format = document.getElementById('key-result-format').value;
        
        if (!title || isNaN(targetValue)) {
            alert('Please fill in all required fields.');
            return;
        }
        
        const data = {
            title: title,
            description: description,
            objective_id: objectiveId,
            start_value: startValue,
            current_value: currentValue,
            target_value: targetValue,
            format: format,
            status: 'not_started'
        };
        
        fetch('/api/key-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('add-key-result-modal')).hide();
                
                // Reload objective to get updated data
                loadObjective();
                
                // Show success message
                alert('Key result added successfully!');
            } else {
                console.error('Error adding key result:', data.message);
                alert('Error adding key result: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error adding key result:', error);
            alert('Error adding key result. Please try again.');
        });
    }
    
    function showCheckInModal(keyResult) {
        // Set key result info
        document.getElementById('checkin-key-result-id').value = keyResult.id;
        document.getElementById('checkin-key-result-title').value = keyResult.title;
        document.getElementById('checkin-previous-value').value = formatValue(keyResult.current_value, keyResult.format);
        document.getElementById('checkin-current-value').value = keyResult.current_value;
        document.getElementById('checkin-status').value = keyResult.status;
        document.getElementById('checkin-note').value = '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('checkin-modal'));
        modal.show();
    }
    
    function saveCheckIn() {
        const keyResultId = document.getElementById('checkin-key-result-id').value;
        const currentValue = parseFloat(document.getElementById('checkin-current-value').value);
        const status = document.getElementById('checkin-status').value;
        const note = document.getElementById('checkin-note').value;
        
        if (isNaN(currentValue)) {
            alert('Please enter a valid current value.');
            return;
        }
        
        const data = {
            key_result_id: keyResultId,
            current_value: currentValue,
            status: status,
            note: note
        };
        
        fetch('/api/check-ins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('checkin-modal')).hide();
                
                // Reload objective to get updated data
                loadObjective();
                
                // Reload check-ins
                loadCheckIns();
                
                // Show success message
                alert('Check-in recorded successfully!');
            } else {
                console.error('Error recording check-in:', data.message);
                alert('Error recording check-in: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error recording check-in:', error);
            alert('Error recording check-in. Please try again.');
        });
    }
    
    function showDeleteConfirmation(type, id, name = '') {
        deleteType = type;
        deleteId = id;
        
        let message = '';
        
        switch (type) {
            case 'objective':
                message = 'Are you sure you want to delete this objective? This action cannot be undone and will also delete all associated key results, initiatives, and check-ins.';
                break;
            case 'keyResult':
                message = `Are you sure you want to delete the key result "${name}"? This action cannot be undone and will also delete all associated initiatives and check-ins.`;
                break;
            default:
                message = 'Are you sure you want to delete this item? This action cannot be undone.';
        }
        
        document.getElementById('delete-confirm-message').textContent = message;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        modal.show();
    }
    
    function confirmDelete() {
        let url = '';
        
        switch (deleteType) {
            case 'objective':
                url = `/api/objectives/${deleteId}`;
                break;
            case 'keyResult':
                url = `/api/key-results/${deleteId}`;
                break;
            default:
                console.error('Invalid delete type');
                return;
        }
        
        fetch(url, {
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
                if (deleteType === 'objective') {
                    // Redirect to objectives list
                    window.location.href = '/objectives';
                } else {
                    // Reload objective to get updated data
                    loadObjective();
                    
                    // Show success message
                    alert('Item deleted successfully!');
                }
            } else {
                console.error('Error deleting item:', data.message);
                alert('Error deleting item: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please try again.');
        });
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
    
    function formatStatus(status) {
        if (!status) return '';
        
        return status.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    function formatLevel(level) {
        if (!level) return '';
        
        return level.charAt(0).toUpperCase() + level.slice(1);
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
</script>
<?php $__env->stopSection(); ?>
<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/runner/workspace/laravel-project/resources/views/objectives/show.blade.php ENDPATH**/ ?>