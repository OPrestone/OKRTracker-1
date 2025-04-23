@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teams.index') }}">Teams</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Team Details</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-8">
            <h1 id="team-name">Loading team...</h1>
            <p class="text-muted mb-0" id="team-department"></p>
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
                        <div class="col-md-8">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Description</label>
                                <p id="team-description">-</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Leader</label>
                                <p id="team-leader">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Team Members</h5>
                    <button type="button" class="btn btn-sm btn-primary" id="add-member-btn">
                        <i class="fas fa-plus"></i> Add Member
                    </button>
                </div>
                <div class="card-body p-0">
                    <ul class="list-group list-group-flush" id="members-list">
                        <li class="list-group-item text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Team Objectives</h5>
                    <a href="#" id="new-objective-btn" class="btn btn-sm btn-primary">
                        <i class="fas fa-plus"></i> New Objective
                    </a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Timeframe</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="objectives-body">
                                <tr>
                                    <td colspan="4" class="text-center py-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer bg-white text-end">
                    <a href="#" id="view-all-objectives-btn" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Member List Item Template -->
<template id="member-item-template">
    <li class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-0 member-name">Member Name</h6>
                <small class="text-muted member-role">Role</small>
            </div>
            <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    Actions
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item change-role-btn" href="#" data-role="leader">Make Leader</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item remove-member-btn text-danger" href="#">Remove from Team</a></li>
                </ul>
            </div>
        </div>
    </li>
</template>

<!-- Add Member Modal -->
<div class="modal fade" id="add-member-modal" tabindex="-1" aria-labelledby="add-member-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="add-member-modal-label">Add Team Member</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="add-member-form">
                    <div class="mb-3">
                        <label for="user-select" class="form-label">User</label>
                        <select class="form-select" id="user-select" required>
                            <option value="">Select User</option>
                            <!-- Users will be loaded here -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="role-select" class="form-label">Role</label>
                        <select class="form-select" id="role-select" required>
                            <option value="member">Member</option>
                            <option value="leader">Leader</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-member-btn">Add Member</button>
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
                <p id="delete-confirm-message">Are you sure you want to delete this team?</p>
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
    let teamId = {{ $id }};
    let team = null;
    let deleteAction = '';
    let deleteUserId = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load team data
        loadTeam();
        
        // Load team objectives
        loadTeamObjectives();
        
        // Set up event listeners
        document.getElementById('add-member-btn').addEventListener('click', showAddMemberModal);
        document.getElementById('save-member-btn').addEventListener('click', saveTeamMember);
        document.getElementById('delete-btn').addEventListener('click', function() {
            showDeleteConfirmation('team');
        });
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
        
        // Set up event delegation for dynamically created elements
        document.addEventListener('click', function(e) {
            // Change role button
            if (e.target.closest('.change-role-btn')) {
                e.preventDefault();
                const memberItem = e.target.closest('.list-group-item');
                const userId = memberItem.dataset.userId;
                const role = e.target.dataset.role;
                changeUserRole(userId, role);
            }
            
            // Remove member button
            if (e.target.closest('.remove-member-btn')) {
                e.preventDefault();
                const memberItem = e.target.closest('.list-group-item');
                const userId = memberItem.dataset.userId;
                const name = memberItem.querySelector('.member-name').textContent;
                showDeleteConfirmation('member', userId, name);
            }
        });
    });
    
    function loadTeam() {
        fetch(`/api/teams/${teamId}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                team = data.data;
                
                // Update the UI with team data
                document.getElementById('team-name').textContent = team.name;
                document.getElementById('team-department').textContent = team.department;
                document.getElementById('team-description').textContent = team.description || 'No description provided.';
                document.getElementById('team-leader').textContent = team.leader ? team.leader.name : 'None';
                
                // Update edit button link
                document.getElementById('edit-btn').href = `/teams/${teamId}/edit`;
                
                // Update new objective button link
                document.getElementById('new-objective-btn').href = `/objectives/create?team_id=${teamId}`;
                
                // Update view all objectives button link
                document.getElementById('view-all-objectives-btn').href = `/objectives?team_id=${teamId}`;
                
                // Render team members
                renderTeamMembers(team.members);
            } else {
                console.error('Error loading team:', data.message);
                alert('Error loading team. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error loading team:', error);
            alert('Error loading team. Please try again.');
        });
    }
    
    function loadTeamObjectives() {
        fetch(`/api/objectives?team_id=${teamId}&limit=5`, {
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
                // Show only the first 5 objectives
                const objectives = data.data.data.slice(0, 5);
                
                objectives.forEach(objective => {
                    const row = document.createElement('tr');
                    
                    // Title column
                    const titleCell = document.createElement('td');
                    const titleLink = document.createElement('a');
                    titleLink.href = `/objectives/${objective.id}`;
                    titleLink.textContent = objective.title;
                    titleCell.appendChild(titleLink);
                    row.appendChild(titleCell);
                    
                    // Timeframe column
                    const timeframeCell = document.createElement('td');
                    timeframeCell.textContent = objective.timeframe ? objective.timeframe.name : '-';
                    row.appendChild(timeframeCell);
                    
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
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 4;
                cell.className = 'text-center py-4';
                cell.textContent = 'No objectives found for this team.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading team objectives:', error);
            
            const tableBody = document.getElementById('objectives-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading objectives. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function renderTeamMembers(members) {
        const membersList = document.getElementById('members-list');
        membersList.innerHTML = '';
        
        if (!members || members.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'list-group-item text-center py-4';
            emptyItem.textContent = 'No members in this team.';
            membersList.appendChild(emptyItem);
            return;
        }
        
        members.forEach(member => {
            const template = document.getElementById('member-item-template');
            const clone = document.importNode(template.content, true);
            const item = clone.querySelector('.list-group-item');
            
            // Set data attribute for user ID
            item.dataset.userId = member.id;
            
            // Update member details
            clone.querySelector('.member-name').textContent = member.name;
            clone.querySelector('.member-role').textContent = member.pivot.role;
            
            // Show/hide actions based on role
            const changeRoleBtn = clone.querySelector('.change-role-btn');
            
            if (member.pivot.role === 'leader') {
                changeRoleBtn.parentElement.classList.add('d-none');
            }
            
            membersList.appendChild(clone);
        });
    }
    
    function showAddMemberModal() {
        // Reset form
        document.getElementById('add-member-form').reset();
        
        // Load users
        loadAvailableUsers();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('add-member-modal'));
        modal.show();
    }
    
    function loadAvailableUsers() {
        fetch('/api/users', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('user-select');
            select.innerHTML = '<option value="">Select User</option>';
            
            if (data.success && data.data.length > 0) {
                // Get current team member IDs
                const memberIds = team.members.map(member => member.id);
                
                // Filter out users who are already team members
                const availableUsers = data.data.filter(user => !memberIds.includes(user.id));
                
                availableUsers.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading available users:', error);
        });
    }
    
    function saveTeamMember() {
        const userId = document.getElementById('user-select').value;
        const role = document.getElementById('role-select').value;
        
        if (!userId) {
            alert('Please select a user to add.');
            return;
        }
        
        fetch(`/api/teams/${teamId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                user_id: userId,
                role: role
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('add-member-modal')).hide();
                
                // Reload team data
                loadTeam();
                
                // Show success message
                alert('Team member added successfully!');
            } else {
                console.error('Error adding team member:', data.message);
                alert('Error adding team member: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error adding team member:', error);
            alert('Error adding team member. Please try again.');
        });
    }
    
    function changeUserRole(userId, role) {
        if (!userId || !role) return;
        
        fetch(`/api/teams/${teamId}/members/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                role: role
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload team data
                loadTeam();
                
                // Show success message
                alert('Member role updated successfully!');
            } else {
                console.error('Error updating member role:', data.message);
                alert('Error updating member role: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error updating member role:', error);
            alert('Error updating member role. Please try again.');
        });
    }
    
    function showDeleteConfirmation(action, userId = null, name = '') {
        deleteAction = action;
        deleteUserId = userId;
        
        let message = '';
        
        switch (action) {
            case 'team':
                message = 'Are you sure you want to delete this team? This action cannot be undone.';
                break;
            case 'member':
                message = `Are you sure you want to remove ${name} from the team?`;
                break;
            default:
                message = 'Are you sure you want to proceed with this action?';
        }
        
        document.getElementById('delete-confirm-message').textContent = message;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        modal.show();
    }
    
    function confirmDelete() {
        let url = '';
        let method = 'DELETE';
        
        switch (deleteAction) {
            case 'team':
                url = `/api/teams/${teamId}`;
                break;
            case 'member':
                url = `/api/teams/${teamId}/members/${deleteUserId}`;
                break;
            default:
                console.error('Invalid delete action');
                return;
        }
        
        fetch(url, {
            method: method,
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
                if (deleteAction === 'team') {
                    // Redirect to teams list
                    window.location.href = '/teams';
                } else {
                    // Reload team data
                    loadTeam();
                    
                    // Show success message
                    alert('Member removed successfully!');
                }
            } else {
                console.error('Error:', data.message);
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
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
</script>
@endsection