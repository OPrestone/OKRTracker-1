@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Check-ins</h1>
        </div>
        <div class="col-md-4 text-md-end">
            <a href="{{ route('check-ins.create') }}" class="btn btn-primary">
                <i class="fas fa-plus"></i> New Check-in
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
                                    <select id="objective-filter" class="form-select" name="objective_id">
                                        <option value="">All Objectives</option>
                                        <!-- Objectives will be loaded here -->
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <select id="team-filter" class="form-select" name="team_id">
                                        <option value="">All Teams</option>
                                        <!-- Teams will be loaded here -->
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search...">
                                <button class="btn btn-outline-secondary" type="button" id="search-button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>User</th>
                                    <th>Objective / Key Result</th>
                                    <th>Current Value</th>
                                    <th>Change</th>
                                    <th>Note</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="check-ins-body">
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
        <div class="col-md-12 mb-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">My Recent Check-ins</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Objective / Key Result</th>
                                    <th>Current Value</th>
                                    <th>Change</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody id="my-check-ins-body">
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

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="delete-confirm-modal" tabindex="-1" aria-labelledby="delete-confirm-modal-label" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="delete-confirm-modal-label">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p id="delete-confirm-message">Are you sure you want to delete this check-in?</p>
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
    let deleteCheckInId = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load filter options
        loadTimeframes();
        loadObjectives();
        loadTeams();
        
        // Load check-ins
        loadCheckIns();
        
        // Load my check-ins
        loadMyCheckIns();
        
        // Set up event listeners for filters
        document.getElementById('timeframe-filter').addEventListener('change', function() {
            loadCheckIns();
        });
        
        document.getElementById('objective-filter').addEventListener('change', function() {
            loadCheckIns();
        });
        
        document.getElementById('team-filter').addEventListener('change', function() {
            loadCheckIns();
        });
        
        document.getElementById('search-button').addEventListener('click', function() {
            loadCheckIns();
        });
        
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadCheckIns();
            }
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
        
        // Set up event delegation for dynamically created delete buttons
        document.addEventListener('click', function(e) {
            if (e.target.closest('.delete-check-in-btn')) {
                e.preventDefault();
                const checkInId = e.target.closest('.delete-check-in-btn').dataset.id;
                showDeleteConfirmation(checkInId);
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
    
    function loadCheckIns(page = 1) {
        const timeframeId = document.getElementById('timeframe-filter').value;
        const objectiveId = document.getElementById('objective-filter').value;
        const teamId = document.getElementById('team-filter').value;
        const search = document.getElementById('search-input').value;
        
        let url = `/api/check-ins?page=${page}`;
        
        if (timeframeId) {
            url += `&timeframe_id=${timeframeId}`;
        }
        
        if (objectiveId) {
            url += `&objective_id=${objectiveId}`;
        }
        
        if (teamId) {
            url += `&team_id=${teamId}`;
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
            const tableBody = document.getElementById('check-ins-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(checkIn => {
                    const row = createCheckInRow(checkIn, true);
                    tableBody.appendChild(row);
                });
                
                // Create pagination
                renderPagination(data.data, loadCheckIns);
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.className = 'text-center py-4';
                cell.textContent = 'No check-ins found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading check-ins:', error);
            
            const tableBody = document.getElementById('check-ins-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading check-ins. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function loadMyCheckIns() {
        fetch('/api/check-ins/my?limit=5', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('my-check-ins-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(checkIn => {
                    const row = createCheckInRow(checkIn, false);
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
            console.error('Error loading my check-ins:', error);
            
            const tableBody = document.getElementById('my-check-ins-body');
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
    
    function createCheckInRow(checkIn, includeActions = true) {
        const row = document.createElement('tr');
        
        // Date column
        const dateCell = document.createElement('td');
        const date = new Date(checkIn.created_at);
        dateCell.textContent = date.toLocaleString();
        row.appendChild(dateCell);
        
        // User column (only for main table)
        if (includeActions) {
            const userCell = document.createElement('td');
            userCell.textContent = checkIn.user ? checkIn.user.name : '-';
            row.appendChild(userCell);
        }
        
        // Objective/Key Result column
        const itemCell = document.createElement('td');
        if (checkIn.key_result) {
            const keyResultLink = document.createElement('a');
            keyResultLink.href = `/key-results/${checkIn.key_result_id}`;
            keyResultLink.textContent = checkIn.key_result.title;
            
            const objectiveName = document.createElement('div');
            objectiveName.className = 'small text-muted';
            objectiveName.textContent = checkIn.key_result.objective ? checkIn.key_result.objective.title : '-';
            
            itemCell.appendChild(keyResultLink);
            itemCell.appendChild(objectiveName);
        } else {
            itemCell.textContent = '-';
        }
        row.appendChild(itemCell);
        
        // Current Value column
        const valueCell = document.createElement('td');
        valueCell.textContent = formatValue(checkIn.current_value, checkIn.key_result ? checkIn.key_result.format : 'number');
        row.appendChild(valueCell);
        
        // Change column
        const changeCell = document.createElement('td');
        const change = checkIn.current_value - checkIn.previous_value;
        const changeEl = document.createElement('span');
        
        if (change > 0) {
            changeEl.className = 'text-success';
            changeEl.textContent = '+' + formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
        } else if (change < 0) {
            changeEl.className = 'text-danger';
            changeEl.textContent = formatValue(change, checkIn.key_result ? checkIn.key_result.format : 'number');
        } else {
            changeEl.textContent = 'No change';
        }
        
        changeCell.appendChild(changeEl);
        row.appendChild(changeCell);
        
        // Note column
        const noteCell = document.createElement('td');
        noteCell.textContent = checkIn.note || '-';
        row.appendChild(noteCell);
        
        // Actions column (only for main table)
        if (includeActions) {
            const actionsCell = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'btn-group';
            
            const viewBtn = document.createElement('a');
            viewBtn.href = `/check-ins/${checkIn.id}`;
            viewBtn.className = 'btn btn-sm btn-outline-primary';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.title = 'View';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger delete-check-in-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.dataset.id = checkIn.id;
            
            actionsDiv.appendChild(viewBtn);
            actionsDiv.appendChild(deleteBtn);
            actionsCell.appendChild(actionsDiv);
            row.appendChild(actionsCell);
        }
        
        return row;
    }
    
    function showDeleteConfirmation(checkInId) {
        deleteCheckInId = checkInId;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        modal.show();
    }
    
    function confirmDelete() {
        if (!deleteCheckInId) return;
        
        fetch(`/api/check-ins/${deleteCheckInId}`, {
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
                // Reload check-ins
                loadCheckIns();
                loadMyCheckIns();
                
                // Show success message
                alert('Check-in deleted successfully!');
            } else {
                console.error('Error deleting check-in:', data.message);
                alert('Error deleting check-in: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting check-in:', error);
            alert('Error deleting check-in. Please try again.');
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
@endsection