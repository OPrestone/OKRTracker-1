@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-8">
            <h1>Timeframes</h1>
        </div>
        <div class="col-md-4 text-md-end">
            <a href="{{ route('timeframes.create') }}" class="btn btn-primary">
                <i class="fas fa-plus"></i> Create Timeframe
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
                                    <select id="cadence-filter" class="form-select" name="cadence_id">
                                        <option value="">All Cadences</option>
                                        <!-- Cadences will be loaded here -->
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <select id="status-filter" class="form-select" name="status">
                                        <option value="">All Statuses</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search timeframes...">
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
                                    <th>Name</th>
                                    <th>Cadence</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Objectives</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="timeframes-body">
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
                    <h5 class="mb-0">Cadences</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Duration</th>
                                    <th>Active Timeframes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="cadences-body">
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
                <div class="card-footer bg-white text-end">
                    <a href="{{ route('cadences.index') }}" class="btn btn-sm btn-outline-primary">Manage Cadences</a>
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
                <p id="delete-confirm-message">Are you sure you want to delete this timeframe?</p>
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
    let deleteId = null;
    let deleteType = '';
    
    document.addEventListener('DOMContentLoaded', function() {
        // Load cadences for filter
        loadCadences();
        
        // Load timeframes
        loadTimeframes();
        
        // Set up event listeners
        document.getElementById('cadence-filter').addEventListener('change', function() {
            loadTimeframes();
        });
        
        document.getElementById('status-filter').addEventListener('change', function() {
            loadTimeframes();
        });
        
        document.getElementById('search-button').addEventListener('click', function() {
            loadTimeframes();
        });
        
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadTimeframes();
            }
        });
        
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    });
    
    function loadCadences() {
        fetch('/api/cadences', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('cadence-filter');
            const tableBody = document.getElementById('cadences-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.length > 0) {
                // Populate filter
                data.data.forEach(cadence => {
                    const option = document.createElement('option');
                    option.value = cadence.id;
                    option.textContent = cadence.name;
                    select.appendChild(option);
                    
                    // Populate table
                    const row = document.createElement('tr');
                    
                    // Name column
                    const nameCell = document.createElement('td');
                    nameCell.textContent = cadence.name;
                    row.appendChild(nameCell);
                    
                    // Type column
                    const typeCell = document.createElement('td');
                    typeCell.textContent = formatCadenceType(cadence.type);
                    row.appendChild(typeCell);
                    
                    // Duration column
                    const durationCell = document.createElement('td');
                    durationCell.textContent = cadence.duration_amount + ' ' + formatDurationType(cadence.duration_unit);
                    row.appendChild(durationCell);
                    
                    // Active Timeframes column
                    const timeframesCell = document.createElement('td');
                    const activeTimeframes = cadence.timeframes ? cadence.timeframes.filter(tf => tf.status === 'active').length : 0;
                    timeframesCell.textContent = activeTimeframes.toString();
                    row.appendChild(timeframesCell);
                    
                    // Actions column
                    const actionsCell = document.createElement('td');
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'btn-group';
                    
                    const editBtn = document.createElement('a');
                    editBtn.href = `/cadences/${cadence.id}/edit`;
                    editBtn.className = 'btn btn-sm btn-outline-secondary';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                    editBtn.title = 'Edit';
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-outline-danger';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteBtn.title = 'Delete';
                    deleteBtn.addEventListener('click', function() {
                        showDeleteConfirmation('cadence', cadence.id, cadence.name);
                    });
                    
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);
                    actionsCell.appendChild(actionsDiv);
                    row.appendChild(actionsCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.className = 'text-center py-4';
                cell.textContent = 'No cadences found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading cadences:', error);
            
            const tableBody = document.getElementById('cadences-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading cadences. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function loadTimeframes(page = 1) {
        const cadenceId = document.getElementById('cadence-filter').value;
        const status = document.getElementById('status-filter').value;
        const search = document.getElementById('search-input').value;
        
        let url = `/api/timeframes?page=${page}`;
        
        if (cadenceId) {
            url += `&cadence_id=${cadenceId}`;
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
            const tableBody = document.getElementById('timeframes-body');
            tableBody.innerHTML = '';
            
            if (data.success && data.data.data.length > 0) {
                data.data.data.forEach(timeframe => {
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
                    
                    // Status column
                    const statusCell = document.createElement('td');
                    const statusBadge = document.createElement('span');
                    statusBadge.className = `badge bg-${getStatusColorClass(timeframe.status)}`;
                    statusBadge.textContent = formatStatus(timeframe.status);
                    statusCell.appendChild(statusBadge);
                    row.appendChild(statusCell);
                    
                    // Objectives column
                    const objectivesCell = document.createElement('td');
                    objectivesCell.textContent = timeframe.objectives ? timeframe.objectives.length : 0;
                    row.appendChild(objectivesCell);
                    
                    // Actions column
                    const actionsCell = document.createElement('td');
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'btn-group';
                    
                    const viewBtn = document.createElement('a');
                    viewBtn.href = `/timeframes/${timeframe.id}`;
                    viewBtn.className = 'btn btn-sm btn-outline-primary';
                    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    viewBtn.title = 'View';
                    
                    const editBtn = document.createElement('a');
                    editBtn.href = `/timeframes/${timeframe.id}/edit`;
                    editBtn.className = 'btn btn-sm btn-outline-secondary';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                    editBtn.title = 'Edit';
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-outline-danger';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteBtn.title = 'Delete';
                    deleteBtn.addEventListener('click', function() {
                        showDeleteConfirmation('timeframe', timeframe.id, timeframe.name);
                    });
                    
                    actionsDiv.appendChild(viewBtn);
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);
                    actionsCell.appendChild(actionsDiv);
                    row.appendChild(actionsCell);
                    
                    tableBody.appendChild(row);
                });
                
                // Create pagination
                renderPagination(data.data, loadTimeframes);
            } else {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.className = 'text-center py-4';
                cell.textContent = 'No timeframes found.';
                row.appendChild(cell);
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error loading timeframes:', error);
            
            const tableBody = document.getElementById('timeframes-body');
            tableBody.innerHTML = '';
            
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'text-center py-4 text-danger';
            cell.textContent = 'Error loading timeframes. Please try again.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        });
    }
    
    function showDeleteConfirmation(type, id, name = '') {
        deleteType = type;
        deleteId = id;
        
        let message = '';
        
        switch (type) {
            case 'timeframe':
                message = `Are you sure you want to delete the timeframe "${name}"? This action cannot be undone and will also affect associated objectives.`;
                break;
            case 'cadence':
                message = `Are you sure you want to delete the cadence "${name}"? This action cannot be undone and will affect all associated timeframes.`;
                break;
            default:
                message = 'Are you sure you want to delete this item? This action cannot be undone.';
        }
        
        document.getElementById('delete-confirm-message').textContent = message;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        modal.show();
    }
    
    function confirmDelete() {
        let url = '';
        
        switch (deleteType) {
            case 'timeframe':
                url = `/api/timeframes/${deleteId}`;
                break;
            case 'cadence':
                url = `/api/cadences/${deleteId}`;
                break;
            default:
                console.error('Invalid delete type');
                return;
        }
        
        fetch(url, {
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
                // Reload data
                loadCadences();
                loadTimeframes();
                
                // Show success message
                alert('Item deleted successfully!');
            } else {
                console.error('Error deleting item:', data.message);
                alert('Error deleting item: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please try again.');
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
    
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    }
    
    function formatCadenceType(type) {
        if (!type) return '';
        
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    function formatDurationType(unit) {
        if (!unit) return '';
        
        // Pluralize if needed
        return unit + (unit === 'month' || unit === 'week' || unit === 'year' || unit === 'day' ? 's' : '');
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
            default:
                return 'secondary';
        }
    }
</script>
@endsection