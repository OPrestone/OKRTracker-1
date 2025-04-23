@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Objectives</h1>
        </div>
        <div class="col-md-4 text-md-end">
            <a href="{{ route('objectives.create') }}" class="btn btn-primary">
                <i class="fas fa-plus"></i> Create Objective
            </a>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header bg-white">
                    <div class="row">
                        <div class="col-md-8">
                            <form id="filter-form" class="row g-3">
                                <div class="col-md-4">
                                    <select id="timeframe-filter" class="form-select" name="timeframe_id">
                                        <option value="">All Timeframes</option>
                                        <!-- Timeframes will be loaded here -->
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <select id="team-filter" class="form-select" name="team_id">
                                        <option value="">All Teams</option>
                                        <!-- Teams will be loaded here -->
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <select id="status-filter" class="form-select" name="status">
                                        <option value="">All Statuses</option>
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="at_risk">At Risk</option>
                                        <option value="completed">Completed</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search objectives...">
                                <button class="btn btn-outline-secondary" type="button" id="search-button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="objectives-table">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Owner</th>
                                    <th>Team</th>
                                    <th>Timeframe</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="objectives-body">
                                <tr>
                                    <td colspan="7" class="text-center py-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
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
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">My Objectives</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="my-objectives-table">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Timeframe</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="my-objectives-body">
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
                    <a href="{{ route('objectives.my') }}" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Team Objectives</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="team-objectives-table">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Team</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="team-objectives-body">
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
                    <a href="{{ route('objectives.team') }}" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load timeframes
        loadTimeframes();
        
        // Load teams
        loadTeams();
        
        // Load objectives
        loadObjectives();
        
        // Load my objectives
        loadMyObjectives();
        
        // Load team objectives
        loadTeamObjectives();
        
        // Set up event listeners
        document.getElementById('timeframe-filter').addEventListener('change', function() {
            loadObjectives();
        });
        
        document.getElementById('team-filter').addEventListener('change', function() {
            loadObjectives();
        });
        
        document.getElementById('status-filter').addEventListener('change', function() {
            loadObjectives();
        });
        
        document.getElementById('search-button').addEventListener('click', function() {
            loadObjectives();
        });
        
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadObjectives();
            }
        });
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
    
    function loadTeams() {
        fetch('/api/teams', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('team-filter');
            
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
    
    function loadObjectives(page = 1) {
        const timeframeId = document.getElementById('timeframe-filter').value;
        const teamId = document.getElementById('team-filter').value;
        const status = document.getElementById('status-filter').value;
        const search = document.getElementById('search-input').value;
        
        let url = `/api/objectives?page=${page}`;
        
        if (timeframeId) {
            url += `&timeframe_id=${timeframeId}`;
        }
        
        if (teamId) {
            url += `&team_id=${teamId}`;
        }
        
        if (status) {
            url += `&status=${status}`;
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
                    
                    // Owner column
                    const ownerCell = document.createElement('td');
                    ownerCell.textContent = objective.owner ? objective.owner.name : '-';
                    row.appendChild(ownerCell);
                    
                    // Team column
                    const teamCell = document.createElement('td');
                    teamCell.textContent = objective.team ? objective.team.name : '-';
                    row.appendChild(teamCell);
                    
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
                
                // Create pagination
                renderPagination(data.data, loadObjectives);
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.className = 'text-center py-4';
                cell.textContent = 'No objectives found.';
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
            cell.colSpan = 7;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading objectives. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function loadMyObjectives() {
        fetch('/api/objectives/my', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('my-objectives-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                // Show only the first 5 objectives
                const objectives = data.data.slice(0, 5);
                
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
                cell.textContent = 'No objectives found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading my objectives:', error);
            
            const tableBody = document.getElementById('my-objectives-body');
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
    
    function loadTeamObjectives() {
        fetch('/api/objectives/team', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('team-objectives-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                // Show only the first 5 objectives
                const objectives = data.data.slice(0, 5);
                
                objectives.forEach(objective => {
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
                cell.textContent = 'No objectives found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading team objectives:', error);
            
            const tableBody = document.getElementById('team-objectives-body');
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