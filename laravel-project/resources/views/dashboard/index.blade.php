@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-12">
            <h1>Dashboard</h1>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-3">
            <div class="card bg-primary text-white">
                <div class="card-body">
                    <h5 class="card-title">Objectives</h5>
                    <h2 class="card-text" id="objectives-count">0</h2>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span>Active</span>
                        <a href="/objectives" class="btn btn-sm btn-light">View All</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-success text-white">
                <div class="card-body">
                    <h5 class="card-title">Key Results</h5>
                    <h2 class="card-text" id="key-results-count">0</h2>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span>Active</span>
                        <a href="/key-results" class="btn btn-sm btn-light">View All</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-info text-white">
                <div class="card-body">
                    <h5 class="card-title">Teams</h5>
                    <h2 class="card-text" id="teams-count">0</h2>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span>Active</span>
                        <a href="/teams" class="btn btn-sm btn-light">View All</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-warning text-white">
                <div class="card-body">
                    <h5 class="card-title">Check-ins</h5>
                    <h2 class="card-text" id="check-ins-count">0</h2>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span>This Week</span>
                        <a href="/check-ins" class="btn btn-sm btn-light">View All</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">My Objectives</h5>
                    <a href="/objectives/my" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Title</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                    <th>Timeline</th>
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
            </div>
        </div>
        <div class="col-md-4">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Recent Check-ins</h5>
                    <a href="/check-ins" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
                <div class="card-body p-0">
                    <div class="list-group list-group-flush" id="recent-checkins">
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

    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center bg-white">
                    <h5 class="mb-0">Active Timeframes</h5>
                    <a href="/timeframes" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Cadence</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Objectives</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="timeframes-body">
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
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load dashboard data
        loadDashboardStats();
        loadMyObjectives();
        loadRecentCheckIns();
        loadActiveTimeframes();
    });
    
    function loadDashboardStats() {
        fetch('/api/dashboard/stats', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('objectives-count').textContent = data.data.objectives_count || 0;
                document.getElementById('key-results-count').textContent = data.data.key_results_count || 0;
                document.getElementById('teams-count').textContent = data.data.teams_count || 0;
                document.getElementById('check-ins-count').textContent = data.data.check_ins_count || 0;
            }
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
        });
    }
    
    function loadMyObjectives() {
        fetch('/api/objectives/my?limit=5', {
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
                data.data.forEach(objective => {
                    const row = document.createElement('tr');
                    
                    // Title column
                    const titleCell = document.createElement('td');
                    const titleLink = document.createElement('a');
                    titleLink.href = `/objectives/${objective.id}`;
                    titleLink.textContent = objective.title;
                    titleCell.appendChild(titleLink);
                    row.appendChild(titleCell);
                    
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
                    
                    // Timeline column
                    const timelineCell = document.createElement('td');
                    timelineCell.textContent = objective.timeframe ? objective.timeframe.name : '-';
                    row.appendChild(timelineCell);
                    
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
    
    function loadRecentCheckIns() {
        fetch('/api/check-ins?limit=5', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('recent-checkins');
            container.innerHTML = '';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(checkIn => {
                    const item = document.createElement('a');
                    item.href = `/check-ins/${checkIn.id}`;
                    item.className = 'list-group-item list-group-item-action';
                    
                    const d = document.createElement('div');
                    d.className = 'd-flex w-100 justify-content-between';
                    
                    const h6 = document.createElement('h6');
                    h6.className = 'mb-1';
                    h6.textContent = checkIn.key_result ? checkIn.key_result.title : 'Check-in';
                    
                    const small = document.createElement('small');
                    const date = new Date(checkIn.created_at);
                    small.textContent = date.toLocaleDateString();
                    
                    d.appendChild(h6);
                    d.appendChild(small);
                    
                    const user = document.createElement('p');
                    user.className = 'mb-1';
                    user.textContent = checkIn.user ? checkIn.user.name : 'Unknown User';
                    
                    const value = document.createElement('small');
                    if (checkIn.previous_value !== checkIn.current_value) {
                        const change = checkIn.current_value - checkIn.previous_value;
                        if (change > 0) {
                            value.className = 'text-success';
                            value.textContent = `${checkIn.previous_value} → ${checkIn.current_value} (+${change})`;
                        } else {
                            value.className = 'text-danger';
                            value.textContent = `${checkIn.previous_value} → ${checkIn.current_value} (${change})`;
                        }
                    } else {
                        value.textContent = `Value: ${checkIn.current_value}`;
                    }
                    
                    item.appendChild(d);
                    item.appendChild(user);
                    item.appendChild(value);
                    
                    container.appendChild(item);
                });
            } else {
                const item = document.createElement('div');
                item.className = 'list-group-item text-center py-4';
                item.textContent = 'No recent check-ins.';
                container.appendChild(item);
            }
        })
        .catch(error => {
            console.error('Error loading recent check-ins:', error);
            
            const container = document.getElementById('recent-checkins');
            container.innerHTML = '';
            
            const item = document.createElement('div');
            item.className = 'list-group-item text-center py-4 text-danger';
            item.textContent = 'Error loading check-ins. Please try again.';
            container.appendChild(item);
        });
    }
    
    function loadActiveTimeframes() {
        fetch('/api/timeframes/active', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('timeframes-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(timeframe => {
                    const row = document.createElement('tr');
                    
                    // Name column
                    const nameCell = document.createElement('td');
                    const nameLink = document.createElement('a');
                    nameLink.href = `/timeframes/${timeframe.id}`;
                    nameLink.textContent = timeframe.name;
                    nameCell.appendChild(nameLink);
                    row.appendChild(nameCell);
                    
                    // Cadence column
                    const cadenceCell = document.createElement('td');
                    cadenceCell.textContent = timeframe.cadence ? timeframe.cadence.name : '-';
                    row.appendChild(cadenceCell);
                    
                    // Start Date column
                    const startDateCell = document.createElement('td');
                    startDateCell.textContent = formatDate(timeframe.start_date);
                    row.appendChild(startDateCell);
                    
                    // End Date column
                    const endDateCell = document.createElement('td');
                    endDateCell.textContent = formatDate(timeframe.end_date);
                    row.appendChild(endDateCell);
                    
                    // Objectives column
                    const objectivesCell = document.createElement('td');
                    objectivesCell.textContent = timeframe.objectives ? timeframe.objectives.length : 0;
                    row.appendChild(objectivesCell);
                    
                    // Status column
                    const statusCell = document.createElement('td');
                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge bg-${getStatusColorClass(timeframe.status)}`;
                    statusBadge.textContent = formatStatus(timeframe.status);
                    statusCell.appendChild(statusBadge);
                    row.appendChild(statusCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.className = 'text-center py-4';
                cell.textContent = 'No active timeframes found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading active timeframes:', error);
            
            const tableBody = document.getElementById('timeframes-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading timeframes. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        
        const date = new Date(dateStr);
        return date.toLocaleDateString();
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
            case 'active':
                return 'success';
            case 'upcoming':
                return 'secondary';
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