@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teams.index') }}">Teams</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teams.show', $team->id) }}">{{ $team->name }}</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Edit Team</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Edit Team</h5>
                </div>
                <div class="card-body">
                    <form id="team-form">
                        <input type="hidden" id="team-id" value="{{ $team->id }}">
                        
                        <div class="mb-3">
                            <label for="team-name" class="form-label">Team Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="team-name" value="{{ $team->name }}" required>
                            <div class="invalid-feedback" id="name-error"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="team-description" class="form-label">Description</label>
                            <textarea class="form-control" id="team-description" rows="3">{{ $team->description }}</textarea>
                            <div class="invalid-feedback" id="description-error"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="team-department" class="form-label">Department <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="team-department" list="department-list" value="{{ $team->department }}" required>
                            <datalist id="department-list">
                                <!-- Departments will be loaded here -->
                            </datalist>
                            <div class="invalid-feedback" id="department-error"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="team-leader" class="form-label">Team Leader <span class="text-danger">*</span></label>
                            <select class="form-select" id="team-leader" required>
                                <option value="">Select Team Leader</option>
                                <!-- Users will be loaded here -->
                            </select>
                            <div class="invalid-feedback" id="leader-error"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teams.show', $team->id) }}" class="btn btn-outline-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary" id="save-btn">Update Team</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    // Global variables
    let teamId = {{ $team->id }};
    let team = {
        name: '{{ $team->name }}',
        description: '{{ $team->description }}',
        department: '{{ $team->department }}',
        leader_id: '{{ $team->leader_id }}'
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load departments
        loadDepartments();
        
        // Load users and set the current leader
        loadUsers();
        
        // Set up event listeners
        document.getElementById('team-form').addEventListener('submit', saveTeam);
    });
    
    function loadDepartments() {
        fetch('/api/teams/departments', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('department-list');
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(department => {
                    const option = document.createElement('option');
                    option.value = department;
                    datalist.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading departments:', error);
        });
    }
    
    function loadUsers() {
        fetch('/api/users', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const leaderSelect = document.getElementById('team-leader');
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(user => {
                    // Add to leader select
                    const leaderOption = document.createElement('option');
                    leaderOption.value = user.id;
                    leaderOption.textContent = user.name;
                    
                    if (user.id == team.leader_id) {
                        leaderOption.selected = true;
                    }
                    
                    leaderSelect.appendChild(leaderOption);
                });
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
        });
    }
    
    function saveTeam(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Get form data
        const name = document.getElementById('team-name').value;
        const description = document.getElementById('team-description').value;
        const department = document.getElementById('team-department').value;
        const leaderId = document.getElementById('team-leader').value;
        
        // Validate form
        let isValid = true;
        
        if (!name) {
            showError('name-error', 'Team name is required');
            isValid = false;
        }
        
        if (!department) {
            showError('department-error', 'Department is required');
            isValid = false;
        }
        
        if (!leaderId) {
            showError('leader-error', 'Team leader is required');
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }
        
        // Disable save button during request
        const saveBtn = document.getElementById('save-btn');
        const originalBtnText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Prepare data for API
        const data = {
            name: name,
            description: description,
            department: department,
            leader_id: leaderId
        };
        
        // Send API request
        fetch(`/api/teams/${teamId}`, {
            method: 'PUT',
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
                alert('Team updated successfully!');
                window.location.href = '/teams/' + teamId;
            } else {
                // Handle validation errors
                if (data.errors) {
                    for (const [field, messages] of Object.entries(data.errors)) {
                        const errorId = field.replace('_', '-') + '-error';
                        showError(errorId, messages[0]);
                    }
                } else {
                    alert('Error updating team: ' + data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error updating team:', error);
            
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalBtnText;
            
            alert('Error updating team. Please try again.');
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
</script>
@endsection