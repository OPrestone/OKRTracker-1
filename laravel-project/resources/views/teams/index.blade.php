@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Teams</h1>
        </div>
        <div class="col-md-4 text-md-end">
            <a href="{{ route('teams.create') }}" class="btn btn-primary">
                <i class="fas fa-plus"></i> Create Team
            </a>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header bg-white">
                    <div class="row">
                        <div class="col-md-6">
                            <form id="filter-form" class="row g-3">
                                <div class="col-md-6">
                                    <select id="department-filter" class="form-select" name="department">
                                        <option value="">All Departments</option>
                                        <!-- Departments will be loaded here -->
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search teams...">
                                <button class="btn btn-outline-secondary" type="button" id="search-button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="teams-container" class="row">
                        <div class="col-12 text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <div id="pagination" class="d-flex justify-content-center">
                        <!-- Pagination will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">My Teams</h5>
                </div>
                <div class="card-body">
                    <div id="my-teams-container" class="row">
                        <div class="col-12 text-center py-4">
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

<!-- Team Card Template -->
<template id="team-card-template">
    <div class="col-md-4 mb-4">
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0 team-name">Team Name</h5>
                <span class="badge bg-primary team-department">Department</span>
            </div>
            <div class="card-body">
                <p class="card-text team-description">Description</p>
                <div class="mb-3">
                    <strong>Leader:</strong> <span class="team-leader">Leader Name</span>
                </div>
                <div class="mb-3">
                    <strong>Members:</strong> <span class="team-member-count">0</span>
                </div>
                <div class="mb-0">
                    <strong>Objectives:</strong> <span class="team-objective-count">0</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="btn-group w-100">
                    <a href="#" class="btn btn-outline-primary team-view-btn">
                        <i class="fas fa-eye"></i> View
                    </a>
                    <a href="#" class="btn btn-outline-secondary team-edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load departments
        loadDepartments();
        
        // Load teams
        loadTeams();
        
        // Load my teams
        loadMyTeams();
        
        // Set up event listeners
        document.getElementById('department-filter').addEventListener('change', function() {
            loadTeams();
        });
        
        document.getElementById('search-button').addEventListener('click', function() {
            loadTeams();
        });
        
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadTeams();
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
            const select = document.getElementById('department-filter');
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(department => {
                    const option = document.createElement('option');
                    option.value = department;
                    option.textContent = department;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading departments:', error);
        });
    }
    
    function loadTeams(page = 1) {
        const department = document.getElementById('department-filter').value;
        const search = document.getElementById('search-input').value;
        
        let url = `/api/teams?page=${page}`;
        
        if (department) {
            url += `&department=${department}`;
        }
        
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('teams-container');
            container.innerHTML = '';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(team => {
                    container.appendChild(createTeamCard(team));
                });
                
                // Create pagination
                renderPagination(data.data, loadTeams);
            } else {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'col-12 text-center py-4';
                emptyMessage.textContent = 'No teams found.';
                container.appendChild(emptyMessage);
            }
        })
        .catch(error => {
            console.error('Error loading teams:', error);
            
            const container = document.getElementById('teams-container');
            container.innerHTML = '';
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'col-12 text-center py-4 text-danger';
            errorMessage.textContent = 'Error loading teams. Please try again.';
            container.appendChild(errorMessage);
        });
    }
    
    function loadMyTeams() {
        fetch('/api/teams/my', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('my-teams-container');
            container.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(team => {
                    container.appendChild(createTeamCard(team));
                });
            } else {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'col-12 text-center py-4';
                emptyMessage.textContent = 'You are not a member of any team.';
                container.appendChild(emptyMessage);
            }
        })
        .catch(error => {
            console.error('Error loading my teams:', error);
            
            const container = document.getElementById('my-teams-container');
            container.innerHTML = '';
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'col-12 text-center py-4 text-danger';
            errorMessage.textContent = 'Error loading your teams. Please try again.';
            container.appendChild(errorMessage);
        });
    }
    
    function createTeamCard(team) {
        const template = document.getElementById('team-card-template');
        const clone = document.importNode(template.content, true);
        
        // Update team details
        clone.querySelector('.team-name').textContent = team.name;
        clone.querySelector('.team-department').textContent = team.department;
        clone.querySelector('.team-description').textContent = team.description || 'No description provided.';
        clone.querySelector('.team-leader').textContent = team.leader ? team.leader.name : 'None';
        clone.querySelector('.team-member-count').textContent = team.members ? team.members.length : 0;
        clone.querySelector('.team-objective-count').textContent = team.objectives ? team.objectives.length : 0;
        
        // Update action links
        clone.querySelector('.team-view-btn').href = `/teams/${team.id}`;
        clone.querySelector('.team-edit-btn').href = `/teams/${team.id}/edit`;
        
        return clone;
    }
    
    function renderPagination(data, callback) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (data.last_page <= 1) {
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'pagination';
        
        // Previous page
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${data.current_page === 1 ? 'disabled' : ''}`;
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.textContent = 'Previous';
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (data.current_page > 1) {
                callback(data.current_page - 1);
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Page numbers
        let startPage = Math.max(1, data.current_page - 2);
        let endPage = Math.min(data.last_page, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${data.current_page === i ? 'active' : ''}`;
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.textContent = i;
            link.addEventListener('click', function(e) {
                e.preventDefault();
                callback(i);
            });
            li.appendChild(link);
            ul.appendChild(li);
        }
        
        // Next page
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${data.current_page === data.last_page ? 'disabled' : ''}`;
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.textContent = 'Next';
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (data.current_page < data.last_page) {
                callback(data.current_page + 1);
            }
        });
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        pagination.appendChild(ul);
    }
</script>
@endsection