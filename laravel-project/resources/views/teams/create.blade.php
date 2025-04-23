@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teams.index') }}">Teams</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Create Team</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Create New Team</h5>
                </div>
                <div class="card-body">
                    <form id="team-form">
                        <div class="mb-3">
                            <label for="team-name" class="form-label">Team Name <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="team-name" required>
                            <div class="invalid-feedback" id="name-error"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="team-description" class="form-label">Description</label>
                            <textarea class="form-control" id="team-description" rows="3"></textarea>
                            <div class="invalid-feedback" id="description-error"></div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="team-department" class="form-label">Department <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="team-department" list="department-list" required>
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
                        
                        <div class="mb-4">
                            <label class="form-label">Team Members</label>
                            <div id="members-container" class="border rounded p-3">
                                <div class="mb-3">
                                    <select class="form-select" id="member-select">
                                        <option value="">Select Members to Add</option>
                                        <!-- Users will be loaded here -->
                                    </select>
                                </div>
                                
                                <div id="selected-members" class="mb-2">
                                    <!-- Selected members will be shown here -->
                                    <p class="text-muted mb-0" id="no-members-message">No members selected. Your team leader will be automatically added as a member.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teams.index') }}" class="btn btn-outline-secondary">Cancel</a>
                            <button type="submit" class="btn btn-primary" id="save-btn">Create Team</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Member Template -->
<template id="member-badge-template">
    <div class="badge bg-light text-dark border me-2 mb-2 p-2 member-badge" style="font-size: 0.9rem;">
        <span class="member-name"></span>
        <button type="button" class="btn-close ms-2 remove-member" style="font-size: 0.6rem;" aria-label="Remove"></button>
    </div>
</template>

@endsection

@section('scripts')
<script>
    // Global variables
    let selectedMembers = new Set();
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load departments
        loadDepartments();
        
        // Load users
        loadUsers();
        
        // Set up event listeners
        document.getElementById('team-form').addEventListener('submit', saveTeam);
        
        document.getElementById('team-leader').addEventListener('change', function() {
            const leaderId = this.value;
            if (leaderId) {
                selectedMembers.add(leaderId);
                updateSelectedMembers();
            }
        });
        
        document.getElementById('member-select').addEventListener('change', function() {
            const memberId = this.value;
            if (memberId) {
                selectedMembers.add(memberId);
                updateSelectedMembers();
                this.value = '';
            }
        });
        
        // Set up event delegation for remove buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-member')) {
                const badge = e.target.closest('.member-badge');
                const memberId = badge.dataset.userId;
                
                // Don't allow removing the leader
                const leaderId = document.getElementById('team-leader').value;
                if (memberId === leaderId) {
                    alert('The team leader cannot be removed from the members list.');
                    return;
                }
                
                selectedMembers.delete(memberId);
                updateSelectedMembers();
            }
        });
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
            const memberSelect = document.getElementById('member-select');
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(user => {
                    // Add to leader select
                    const leaderOption = document.createElement('option');
                    leaderOption.value = user.id;
                    leaderOption.textContent = user.name;
                    leaderSelect.appendChild(leaderOption);
                    
                    // Add to member select
                    const memberOption = document.createElement('option');
                    memberOption.value = user.id;
                    memberOption.textContent = user.name;
                    memberSelect.appendChild(memberOption);
                });
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
        });
    }
    
    function updateSelectedMembers() {
        const container = document.getElementById('selected-members');
        const noMembersMessage = document.getElementById('no-members-message');
        
        // Clear existing badges
        container.querySelectorAll('.member-badge').forEach(badge => badge.remove());
        
        if (selectedMembers.size === 0) {
            noMembersMessage.classList.remove('d-none');
            return;
        }
        
        noMembersMessage.classList.add('d-none');
        
        // Get user data for selected members
        const leaderSelect = document.getElementById('team-leader');
        const memberSelect = document.getElementById('member-select');
        
        selectedMembers.forEach(memberId => {
            // Find user name from selects
            let userName = '';
            
            // Check leader select
            for (const option of leaderSelect.options) {
                if (option.value === memberId) {
                    userName = option.textContent;
                    break;
                }
            }
            
            // If not found in leader select, check member select
            if (!userName) {
                for (const option of memberSelect.options) {
                    if (option.value === memberId) {
                        userName = option.textContent;
                        break;
                    }
                }
            }
            
            if (userName) {
                const template = document.getElementById('member-badge-template');
                const clone = document.importNode(template.content, true);
                const badge = clone.querySelector('.member-badge');
                
                // Set data attribute for user ID
                badge.dataset.userId = memberId;
                
                // Update member name
                clone.querySelector('.member-name').textContent = userName;
                
                // Highlight the leader
                const leaderId = leaderSelect.value;
                if (memberId === leaderId) {
                    badge.classList.add('bg-primary');
                    badge.classList.remove('bg-light', 'text-dark');
                    badge.classList.add('text-white');
                    badge.querySelector('.member-name').textContent += ' (Leader)';
                }
                
                container.appendChild(clone);
            }
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
        const members = Array.from(selectedMembers);
        
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
            leader_id: leaderId,
            members: members
        };
        
        // Send API request
        fetch('/api/teams', {
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
                alert('Team created successfully!');
                window.location.href = '/teams/' + data.data.id;
            } else {
                // Handle validation errors
                if (data.errors) {
                    for (const [field, messages] of Object.entries(data.errors)) {
                        const errorId = field.replace('_', '-') + '-error';
                        showError(errorId, messages[0]);
                    }
                } else {
                    alert('Error creating team: ' + data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error creating team:', error);
            
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = originalBtnText;
            
            alert('Error creating team. Please try again.');
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