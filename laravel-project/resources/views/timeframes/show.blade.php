@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('timeframes.index') }}">Timeframes</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Timeframe Details</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-8">
            <h1 id="timeframe-name">Loading timeframe...</h1>
            <p class="text-muted mb-0" id="timeframe-cadence"></p>
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
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Start Date</label>
                                <p id="timeframe-start-date">-</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label fw-bold">End Date</label>
                                <p id="timeframe-end-date">-</p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Status</label>
                                <p id="timeframe-status"><span class="badge bg-secondary">-</span></p>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Duration</label>
                                <p id="timeframe-duration">-</p>
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
                    <h5 class="mb-0">Objectives</h5>
                    <div>
                        <button type="button" class="btn btn-sm btn-outline-primary me-2" id="generate-btn">
                            <i class="fas fa-magic"></i> Generate Objectives
                        </button>
                        <a href="#" id="add-objective-btn" class="btn btn-sm btn-primary">
                            <i class="fas fa-plus"></i> Add Objective
                        </a>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Team</th>
                                    <th>Owner</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="objectives-body">
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
                <p id="delete-confirm-message">Are you sure you want to delete this timeframe? This action cannot be undone and will affect all associated objectives.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirm-delete-btn">Delete</button>
            </div>
        </div>
    </div>
</div>

<!-- Generate Objectives Modal -->
<div class="modal fade" id="generate-objectives-modal" tabindex="-1" aria-labelledby="generate-objectives-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="generate-objectives-modal-label">Generate Objectives from Template</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="generate-form">
                    <div class="mb-3">
                        <label for="template-select" class="form-label">Select Template</label>
                        <select class="form-select" id="template-select" required>
                            <option value="">Select a Template</option>
                            <!-- Templates will be loaded here -->
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="team-select" class="form-label">Apply to Team</label>
                        <select class="form-select" id="team-select" required>
                            <option value="">Select a Team</option>
                            <!-- Teams will be loaded here -->
                        </select>
                    </div>
                    
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="customize-check">
                        <label class="form-check-label" for="customize-check">Customize Objectives</label>
                    </div>
                    
                    <div id="preview-container" class="mb-3 d-none">
                        <label class="form-label">Preview</label>
                        <div class="border rounded p-3">
                            <div id="preview-content">
                                <!-- Preview will be loaded here -->
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="generate-confirm-btn">Generate</button>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    // Global variables
    let timeframeId = {{ $id }};
    let timeframe = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load timeframe data
        loadTimeframe();
        
        // Load objectives
        loadObjectives();
        
        // Set up event listeners
        document.getElementById('delete-btn').addEventListener('click', function() {
            showDeleteConfirmation();
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
        
        document.getElementById('generate-btn').addEventListener('click', showGenerateModal);
        
        document.getElementById('template-select').addEventListener('change', function() {
            if (this.value && document.getElementById('customize-check').checked) {
                loadTemplatePreview(this.value);
            } else {
                document.getElementById('preview-container').classList.add('d-none');
            }
        });
        
        document.getElementById('customize-check').addEventListener('change', function() {
            if (this.checked) {
                const templateId = document.getElementById('template-select').value;
                if (templateId) {
                    loadTemplatePreview(templateId);
                }
            } else {
                document.getElementById('preview-container').classList.add('d-none');
            }
        });
        
        document.getElementById('generate-confirm-btn').addEventListener('click', generateObjectives);
    });
    
    function loadTimeframe() {
        fetch(`/api/timeframes/${timeframeId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                timeframe = data.data;
                
                // Update the UI with timeframe data
                document.getElementById('timeframe-name').textContent = timeframe.name;
                document.getElementById('timeframe-cadence').textContent = timeframe.cadence ? timeframe.cadence.name : '';
                document.getElementById('timeframe-start-date').textContent = formatDate(timeframe.start_date);
                document.getElementById('timeframe-end-date').textContent = formatDate(timeframe.end_date);
                
                // Update status badge
                const statusBadge = document.createElement('span');
                statusBadge.className = `badge bg-${getStatusColorClass(timeframe.status)}`;
                statusBadge.textContent = formatStatus(timeframe.status);
                document.getElementById('timeframe-status').innerHTML = '';
                document.getElementById('timeframe-status').appendChild(statusBadge);
                
                // Calculate and display duration
                const startDate = new Date(timeframe.start_date);
                const endDate = new Date(timeframe.end_date);
                const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                document.getElementById('timeframe-duration').textContent = `${durationInDays} days`;
                
                // Update edit button link
                document.getElementById('edit-btn').href = `/timeframes/${timeframeId}/edit`;
                
                // Update add objective button link
                document.getElementById('add-objective-btn').href = `/objectives/create?timeframe_id=${timeframeId}`;
            } else {
                console.error('Error loading timeframe:', data.message);
                alert('Error loading timeframe. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error loading timeframe:', error);
            alert('Error loading timeframe. Please try again.');
        });
    }
    
    function loadObjectives() {
        fetch(`/api/objectives?timeframe_id=${timeframeId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('objectives-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(objective => {
                    const row = document.createElement('tr');
                    
                    // Title column
                    const titleCell = document.createElement('td');
                    const titleLink = document.createElement('a');
                    titleLink.href = `/objectives/${objective.id}`;
                    titleLink.textContent = objective.title;
                    titleCell.appendChild(titleLink);
                    row.appendChild(titleCell);
                    
                    // Team column
                    const teamCell = document.createElement('td');
                    teamCell.textContent = objective.team ? objective.team.name : '-';
                    row.appendChild(teamCell);
                    
                    // Owner column
                    const ownerCell = document.createElement('td');
                    ownerCell.textContent = objective.owner ? objective.owner.name : '-';
                    row.appendChild(ownerCell);
                    
                    // Progress column
                    const progressCell = document.createElement('td');
                    const progressBar = document.createElement('div');
                    progressBar.className = 'progress';
                    progressBar.style.height = '10px';
                    
                    const progressBarInner = document.createElement('div');
                    progressBarInner.className = `progress-bar bg-${getProgressColorClass(objective.progress)}`;
                    progressBarInner.style.width = `${objective.progress}%`;
                    progressBarInner.setAttribute('role', 'progressbar');
                    progressBarInner.setAttribute('aria-valuenow', objective.progress);
                    progressBarInner.setAttribute('aria-valuemin', '0');
                    progressBarInner.setAttribute('aria-valuemax', '100');
                    
                    progressBar.appendChild(progressBarInner);
                    
                    const progressText = document.createElement('small');
                    progressText.className = 'mt-1 d-block';
                    progressText.textContent = `${Math.round(objective.progress)}%`;
                    
                    progressCell.appendChild(progressBar);
                    progressCell.appendChild(progressText);
                    row.appendChild(progressCell);
                    
                    // Status column
                    const statusCell = document.createElement('td');
                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge bg-${getStatusColorClass(objective.status)}`;
                    statusBadge.textContent = formatStatus(objective.status);
                    statusCell.appendChild(statusBadge);
                    row.appendChild(statusCell);
                    
                    // Actions column
                    const actionsCell = document.createElement('td');
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'btn-group';
                    
                    const viewBtn = document.createElement('a');
                    viewBtn.href = `/objectives/${objective.id}`;
                    viewBtn.className = 'btn btn-sm btn-outline-primary';
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    viewBtn.title = 'View';
                    
                    const editBtn = document.createElement('a');
                    editBtn.href = `/objectives/${objective.id}/edit`;
                    editBtn.className = 'btn btn-sm btn-outline-secondary';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                    editBtn.title = 'Edit';
                    
                    actionsDiv.appendChild(viewBtn);
                    actionsDiv.appendChild(editBtn);
                    actionsCell.appendChild(actionsDiv);
                    row.appendChild(actionsCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.className = 'text-center py-4';
                cell.textContent = 'No objectives found for this timeframe.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading objectives:', error);
            
            const tableBody = document.getElementById('objectives-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading objectives. Please try again.';
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
        fetch(`/api/timeframes/${timeframeId}`, {
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
                // Redirect to timeframes list
                window.location.href = '/timeframes';
            } else {
                console.error('Error deleting timeframe:', data.message);
                alert('Error deleting timeframe: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting timeframe:', error);
            alert('Error deleting timeframe. Please try again.');
        });
    }
    
    function showGenerateModal() {
        // Reset form
        document.getElementById('generate-form').reset();
        document.getElementById('preview-container').classList.add('d-none');
        
        // Load templates
        loadTemplates();
        
        // Load teams
        loadTeams();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('generate-objectives-modal'));
        modal.show();
    }
    
    function loadTemplates() {
        fetch('/api/okr-templates', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('template-select');
            select.innerHTML = '<option value="">Select a Template</option>';
            
            if (data.success && data.data.templates.length > 0) {
                data.data.templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading templates:', error);
        });
    }
    
    function loadTeams() {
        fetch('/api/teams', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('team-select');
            select.innerHTML = '<option value="">Select a Team</option>';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.id;
                    option.textContent = team.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading teams:', error);
        });
    }
    
    function loadTemplatePreview(templateId) {
        fetch(`/api/okr-templates/${templateId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const previewContainer = document.getElementById('preview-container');
                const previewContent = document.getElementById('preview-content');
                
                previewContent.innerHTML = '';
                
                if (data.data.objectives && data.data.objectives.length > 0) {
                    const objectivesList = document.createElement('div');
                    
                    data.data.objectives.forEach((objective, index) => {
                        const objectiveItem = document.createElement('div');
                        objectiveItem.className = 'mb-3';
                        
                        const objectiveTitle = document.createElement('h6');
                        objectiveTitle.className = 'mb-2';
                        objectiveTitle.textContent = `Objective ${index + 1}: ${objective.title}`;
                        
                        objectiveItem.appendChild(objectiveTitle);
                        
                        if (objective.key_results && objective.key_results.length > 0) {
                            const keyResultsList = document.createElement('ul');
                            keyResultsList.className = 'list-unstyled ms-3';
                            
                            objective.key_results.forEach((kr, krIndex) => {
                                const krItem = document.createElement('li');
                                krItem.className = 'mb-2';
                                krItem.innerHTML = `<strong>KR ${index + 1}.${krIndex + 1}:</strong> ${kr.title}`;
                                keyResultsList.appendChild(krItem);
                            });
                            
                            objectiveItem.appendChild(keyResultsList);
                        }
                        
                        objectivesList.appendChild(objectiveItem);
                    });
                    
                    previewContent.appendChild(objectivesList);
                } else {
                    previewContent.textContent = 'No objectives found in this template.';
                }
                
                previewContainer.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Error loading template preview:', error);
        });
    }
    
    function generateObjectives() {
        const templateId = document.getElementById('template-select').value;
        const teamId = document.getElementById('team-select').value;
        
        if (!templateId || !teamId) {
            alert('Please select both a template and a team.');
            return;
        }
        
        // Disable button during request
        const generateBtn = document.getElementById('generate-confirm-btn');
        const originalBtnText = generateBtn.textContent;
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
        
        fetch('/api/objectives/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                template_id: templateId,
                team_id: teamId,
                timeframe_id: timeframeId
            })
        })
        .then(response => response.json())
        .then(data => {
            // Re-enable button
            generateBtn.disabled = false;
            generateBtn.textContent = originalBtnText;
            
            if (data.success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('generate-objectives-modal')).hide();
                
                // Reload objectives
                loadObjectives();
                
                // Show success message
                alert(`Successfully generated ${data.data.objectives_count} objectives with ${data.data.key_results_count} key results from the template.`);
            } else {
                console.error('Error generating objectives:', data.message);
                alert('Error generating objectives: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error generating objectives:', error);
            
            // Re-enable button
            generateBtn.disabled = false;
            generateBtn.textContent = originalBtnText;
            
            alert('Error generating objectives. Please try again.');
        });
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    }
    
    function formatStatus(status) {
        if (!status) return '';
        
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    function getStatusColorClass(status) {
        switch (status) {
            case 'upcoming':
                return 'secondary';
            case 'active':
                return 'success';
            case 'completed':
                return 'info';
            case 'not_started':
                return 'secondary';
            case 'in_progress':
                return 'primary';
            case 'at_risk':
                return 'warning';
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