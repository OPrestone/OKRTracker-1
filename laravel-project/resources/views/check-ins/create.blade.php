@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('check-ins.index') }}">Check-ins</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Create Check-in</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Record New Check-in</h5>
                </div>
                <div class="card-body">
                    <form id="check-in-form">
                        <div class="mb-3">
                            <label for="key-result-selector" class="form-label">Select a Key Result <span class="text-danger">*</span></label>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <select class="form-select" id="timeframe-filter">
                                        <option value="">All Timeframes</option>
                                        <!-- Timeframes will be loaded here -->
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <select class="form-select" id="objective-filter">
                                        <option value="">All Objectives</option>
                                        <!-- Objectives will be loaded here -->
                                    </select>
                                </div>
                            </div>
                            <select class="form-select" id="key-result-selector" required>
                                <option value="">Select a Key Result</option>
                                <!-- Key Results will be loaded here -->
                            </select>
                            <div class="invalid-feedback" id="key-result-error"></div>
                        </div>
                        
                        <div id="key-result-details" class="mb-4 d-none">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title mb-3" id="kr-title"></h6>
                                    <p class="card-text text-muted mb-3" id="kr-description"></p>
                                    
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">Start Value</label>
                                                <p class="mb-0" id="kr-start-value"></p>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">Current Value</label>
                                                <p class="mb-0" id="kr-current-value"></p>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="mb-3">
                                                <label class="form-label">Target Value</label>
                                                <p class="mb-0" id="kr-target-value"></p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="progress" style="height: 10px;">
                                        <div id="kr-progress-bar" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="current-value" class="form-label">New Value <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control" id="current-value" required>
                                    <div class="invalid-feedback" id="current-value-error"></div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="status" class="form-label">Status <span class="text-danger">*</span></label>
                                    <select class="form-select" id="status" required>
                                        <option value="">Select Status</option>
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="at_risk">At Risk</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                    <div class="invalid-feedback" id="status-error"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label for="note" class="form-label">Note</label>
                            <textarea class="form-control" id="note" rows="3" placeholder="Add any additional context or information about this check-in..."></textarea>
                            <div class="invalid-feedback" id="note-error"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <a href="{{ route('check-ins.index') }}" class="btn btn-outline-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary" id="save-btn">Save Check-in</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Celebration Modal -->
<div class="modal fade" id="celebration-modal" tabindex="-1" aria-labelledby="celebration-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title text-success" id="celebration-modal-label"><i class="fas fa-trophy"></i> Goal Achieved!</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
                <h3 class="mb-4">Congratulations!</h3>
                <p class="mb-4" id="celebration-message">You've reached your target for this key result!</p>
                <div class="mb-4">
                    <i class="fas fa-star text-warning" style="font-size: 3rem;"></i>
                    <i class="fas fa-star text-warning" style="font-size: 4rem;"></i>
                    <i class="fas fa-star text-warning" style="font-size: 3rem;"></i>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Continue</button>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

<script>
    // Global variables
    let keyResults = [];
    let selectedKeyResult = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load timeframes for filter
        loadTimeframes();
        
        // Load objectives for filter
        loadObjectives();
        
        // Load key results
        loadKeyResults();
        
        // Set up event listeners
        document.getElementById('timeframe-filter').addEventListener('change', function() {
            loadObjectivesByTimeframe(this.value);
            loadKeyResults();
        });
        
        document.getElementById('objective-filter').addEventListener('change', function() {
            loadKeyResults();
        });
        
        document.getElementById('key-result-selector').addEventListener('change', function() {
            const keyResultId = this.value;
            if (keyResultId) {
                selectedKeyResult = keyResults.find(kr => kr.id == keyResultId);
                showKeyResultDetails(selectedKeyResult);
            } else {
                selectedKeyResult = null;
                document.getElementById('key-result-details').classList.add('d-none');
            }
        });
        
        document.getElementById('check-in-form').addEventListener('submit', saveCheckIn);
    });
    
    function loadTimeframes() {
        fetch('/api/timeframes/active', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('timeframe-filter');
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(timeframe => {
                    const option = document.createElement('option');
                    option.value = timeframe.id;
                    option.textContent = timeframe.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading timeframes:', error);
        });
    }
    
    function loadObjectives() {
        fetch('/api/objectives?limit=50', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('objective-filter');
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(objective => {
                    const option = document.createElement('option');
                    option.value = objective.id;
                    option.textContent = objective.title;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading objectives:', error);
        });
    }
    
    function loadObjectivesByTimeframe(timeframeId) {
        if (!timeframeId) {
            loadObjectives();
            return;
        }
        
        fetch(`/api/objectives?timeframe_id=${timeframeId}&limit=50`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('objective-filter');
            select.innerHTML = '<option value="">All Objectives</option>';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(objective => {
                    const option = document.createElement('option');
                    option.value = objective.id;
                    option.textContent = objective.title;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading objectives by timeframe:', error);
        });
    }
    
    function loadKeyResults() {
        const timeframeId = document.getElementById('timeframe-filter').value;
        const objectiveId = document.getElementById('objective-filter').value;
        
        let url = '/api/key-results?limit=100';
        
        if (timeframeId) {
            url += `&timeframe_id=${timeframeId}`;
        }
        
        if (objectiveId) {
            url += `&objective_id=${objectiveId}`;
        }
        
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('key-result-selector');
            select.innerHTML = '<option value="">Select a Key Result</option>';
            
            if (data.success && data.data.length > 0) {
                keyResults = data.data;
                
                keyResults.forEach(keyResult => {
                    const option = document.createElement('option');
                    option.value = keyResult.id;
                    option.textContent = keyResult.title;
                    
                    if (keyResult.objective) {
                        option.textContent += ` (${keyResult.objective.title})`;
                    }
                    
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading key results:', error);
        });
    }
    
    function showKeyResultDetails(keyResult) {
        if (!keyResult) return;
        
        document.getElementById('kr-title').textContent = keyResult.title;
        document.getElementById('kr-description').textContent = keyResult.description || 'No description provided.';
        document.getElementById('kr-start-value').textContent = formatValue(keyResult.start_value, keyResult.format);
        document.getElementById('kr-current-value').textContent = formatValue(keyResult.current_value, keyResult.format);
        document.getElementById('kr-target-value').textContent = formatValue(keyResult.target_value, keyResult.format);
        
        // Update progress bar
        const progressBar = document.getElementById('kr-progress-bar');
        progressBar.style.width = `${keyResult.progress}%`;
        progressBar.className = `progress-bar bg-${getProgressColorClass(keyResult.progress)}`;
        progressBar.setAttribute('aria-valuenow', keyResult.progress);
        
        // Set current value as default
        document.getElementById('current-value').value = keyResult.current_value;
        
        // Set current status as default
        document.getElementById('status').value = keyResult.status || 'in_progress';
        
        // Show details card
        document.getElementById('key-result-details').classList.remove('d-none');
    }
    
    function saveCheckIn(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Get form data
        const keyResultId = document.getElementById('key-result-selector').value;
        const currentValue = document.getElementById('current-value').value;
        const status = document.getElementById('status').value;
        const note = document.getElementById('note').value;
        
        // Validate form
        let isValid = true;
        
        if (!keyResultId) {
            showError('key-result-error', 'Please select a key result');
            isValid = false;
        }
        
        if (!currentValue) {
            showError('current-value-error', 'Please enter a current value');
            isValid = false;
        }
        
        if (!status) {
            showError('status-error', 'Please select a status');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Check if target has been achieved
        let targetAchieved = false;
        if (selectedKeyResult) {
            if (selectedKeyResult.target_value >= selectedKeyResult.start_value) {
                // Higher is better
                targetAchieved = parseFloat(currentValue) >= selectedKeyResult.target_value;
            } else {
                // Lower is better
                targetAchieved = parseFloat(currentValue) <= selectedKeyResult.target_value;
            }
        }
        
        // Disable save button during request
        const saveBtn = document.getElementById('save-btn');
        const originalBtnText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Prepare data for API
        const data = {
            key_result_id: keyResultId,
            current_value: parseFloat(currentValue),
            status: status,
            note: note
        };
        
        // Send API request
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
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalBtnText;
            
            if (data.success) {
                if (targetAchieved) {
                    // Show celebration modal and confetti
                    showCelebration();
                } else {
                    // Simply redirect to the check-in details
                    window.location.href = `/check-ins/${data.data.id}`;
                }
            } else {
                // Handle validation errors
                if (data.errors) {
                    for (const [field, messages] of Object.entries(data.errors)) {
                        const errorId = field.replace(/_/g, '-') + '-error';
                        showError(errorId, messages[0]);
                    }
                } else {
                    alert('Error creating check-in: ' + data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error creating check-in:', error);
            
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalBtnText;
            
            alert('Error creating check-in. Please try again.');
        });
    }
    
    function showCelebration() {
        // Launch confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // Show celebration modal
        const modal = new bootstrap.Modal(document.getElementById('celebration-modal'));
        
        // Set celebration message
        if (selectedKeyResult && selectedKeyResult.objective) {
            document.getElementById('celebration-message').textContent = 
                `You've achieved your target for the key result "${selectedKeyResult.title}" under the objective "${selectedKeyResult.objective.title}"!`;
        } else if (selectedKeyResult) {
            document.getElementById('celebration-message').textContent = 
                `You've achieved your target for the key result "${selectedKeyResult.title}"!`;
        }
        
        modal.show();
        
        // Set up event listener to redirect after modal is closed
        document.getElementById('celebration-modal').addEventListener('hidden.bs.modal', function () {
            window.location.href = '/check-ins';
        });
    }
    
    function clearErrors() {
        document.querySelectorAll('.invalid-feedback').forEach(element => {
            element.textContent = '';
        });
        
        document.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
    }
    
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            
            // Find the input element
            const inputId = elementId.replace('-error', '');
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.classList.add('is-invalid');
            }
        }
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