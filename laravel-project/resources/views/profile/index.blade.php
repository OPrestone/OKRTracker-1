@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <h1>Profile</h1>
        </div>
    </div>

    <div class="row">
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Profile Information</h5>
                </div>
                <div class="card-body">
                    <div class="text-center mb-4">
                        <div class="avatar-placeholder rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary text-white" style="width: 100px; height: 100px; font-size: 2.5rem;">
                            <i class="fas fa-user"></i>
                        </div>
                        <h5 id="user-name">Loading...</h5>
                        <p class="text-muted" id="user-email">Loading...</p>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Role</label>
                        <p id="user-role">Loading...</p>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Department</label>
                        <p id="user-department">Loading...</p>
                    </div>
                    
                    <div class="mb-0">
                        <label class="form-label fw-bold">Joined</label>
                        <p id="user-joined">Loading...</p>
                    </div>
                </div>
                <div class="card-footer bg-white text-end">
                    <a href="/profile/edit" class="btn btn-sm btn-primary">Edit Profile</a>
                </div>
            </div>
        </div>
        
        <div class="col-md-8 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">My Teams</h5>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush" id="my-teams">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Activity</h5>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush" id="user-activity">
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
</div>
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load user data
        loadUserProfile();
        
        // Load user teams
        loadUserTeams();
        
        // Load user activity
        loadUserActivity();
    });
    
    function loadUserProfile() {
        fetch('/api/user', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.data;
                
                document.getElementById('user-name').textContent = user.name || 'Anonymous User';
                document.getElementById('user-email').textContent = user.email || 'No email provided';
                document.getElementById('user-role').textContent = user.role || 'User';
                document.getElementById('user-department').textContent = user.department || 'Not assigned';
                
                if (user.created_at) {
                    const joinDate = new Date(user.created_at);
                    document.getElementById('user-joined').textContent = joinDate.toLocaleDateString();
                } else {
                    document.getElementById('user-joined').textContent = 'Unknown';
                }
            } else {
                setErrorMessages();
            }
        })
        .catch(error => {
            console.error('Error loading user profile:', error);
            setErrorMessages();
        });
    }
    
    function loadUserTeams() {
        fetch('/api/teams/my', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('my-teams');
            container.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(team => {
                    const item = document.createElement('a');
                    item.href = `/teams/${team.id}`;
                    item.className = 'list-group-item list-group-item-action';
                    
                    const d = document.createElement('div');
                    d.className = 'd-flex w-100 justify-content-between';
                    
                    const h5 = document.createElement('h5');
                    h5.className = 'mb-1';
                    h5.textContent = team.name;
                    
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-primary';
                    badge.textContent = team.department || 'No Department';
                    
                    d.appendChild(h5);
                    d.appendChild(badge);
                    
                    const role = document.createElement('p');
                    role.className = 'mb-1';
                    role.textContent = team.pivot && team.pivot.role ? `Role: ${team.pivot.role.charAt(0).toUpperCase() + team.pivot.role.slice(1)}` : 'Member';
                    
                    const memberCount = document.createElement('small');
                    memberCount.textContent = `${team.members ? team.members.length : 0} members`;
                    
                    item.appendChild(d);
                    item.appendChild(role);
                    item.appendChild(memberCount);
                    
                    container.appendChild(item);
                });
            } else {
                const item = document.createElement('div');
                item.className = 'list-group-item text-center py-4';
                item.textContent = 'You are not a member of any team.';
                container.appendChild(item);
            }
        })
        .catch(error => {
            console.error('Error loading user teams:', error);
            
            const container = document.getElementById('my-teams');
            container.innerHTML = '';
            
            const item = document.createElement('div');
            item.className = 'list-group-item text-center py-4 text-danger';
            item.textContent = 'Error loading teams. Please try again.';
            container.appendChild(item);
        });
    }
    
    function loadUserActivity() {
        fetch('/api/check-ins/my?limit=10', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('user-activity');
            container.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(activity => {
                    const item = document.createElement('a');
                    item.href = `/check-ins/${activity.id}`;
                    item.className = 'list-group-item list-group-item-action';
                    
                    const d = document.createElement('div');
                    d.className = 'd-flex w-100 justify-content-between';
                    
                    const title = document.createElement('h6');
                    title.className = 'mb-1';
                    title.textContent = 'Check-in on ' + (activity.key_result ? activity.key_result.title : 'Key Result');
                    
                    const date = document.createElement('small');
                    date.className = 'text-muted';
                    const activityDate = new Date(activity.created_at);
                    date.textContent = activityDate.toLocaleDateString();
                    
                    d.appendChild(title);
                    d.appendChild(date);
                    
                    const value = document.createElement('p');
                    value.className = 'mb-1';
                    
                    if (activity.previous_value !== activity.current_value) {
                        const change = activity.current_value - activity.previous_value;
                        if (change > 0) {
                            value.innerHTML = `Value changed from <span class="text-muted">${activity.previous_value}</span> to <span class="text-success">${activity.current_value}</span> <span class="text-success">(+${change})</span>`;
                        } else {
                            value.innerHTML = `Value changed from <span class="text-muted">${activity.previous_value}</span> to <span class="text-danger">${activity.current_value}</span> <span class="text-danger">(${change})</span>`;
                        }
                    } else {
                        value.textContent = `Value remains at ${activity.current_value}`;
                    }
                    
                    const note = document.createElement('small');
                    if (activity.note) {
                        note.textContent = activity.note;
                    } else {
                        note.className = 'text-muted';
                        note.textContent = 'No note provided';
                    }
                    
                    item.appendChild(d);
                    item.appendChild(value);
                    item.appendChild(note);
                    
                    container.appendChild(item);
                });
            } else {
                const item = document.createElement('div');
                item.className = 'list-group-item text-center py-4';
                item.textContent = 'No recent activity found.';
                container.appendChild(item);
            }
        })
        .catch(error => {
            console.error('Error loading user activity:', error);
            
            const container = document.getElementById('user-activity');
            container.innerHTML = '';
            
            const item = document.createElement('div');
            item.className = 'list-group-item text-center py-4 text-danger';
            item.textContent = 'Error loading activity. Please try again.';
            container.appendChild(item);
        });
    }
    
    function setErrorMessages() {
        document.getElementById('user-name').textContent = 'Error loading profile';
        document.getElementById('user-email').textContent = 'Please try again later';
        document.getElementById('user-role').textContent = 'Unknown';
        document.getElementById('user-department').textContent = 'Unknown';
        document.getElementById('user-joined').textContent = 'Unknown';
    }
</script>
@endsection