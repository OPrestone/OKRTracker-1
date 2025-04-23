@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="mb-4">
                <a href="{{ route('templates.index') }}" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> {{ __('Back to Templates') }}
                </a>
            </div>
            
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="m-0" id="template-name">{{ __('Loading Template...') }}</h4>
                        <div class="mt-1">
                            <span class="badge bg-primary" id="template-department"></span>
                            <span class="badge bg-secondary ms-1" id="template-category"></span>
                            <span class="badge bg-info ms-1 d-none" id="ai-badge">AI Generated</span>
                        </div>
                    </div>
                    <div>
                        <a href="#" id="edit-link" class="btn btn-primary me-2">
                            <i class="fas fa-edit"></i> {{ __('Edit') }}
                        </a>
                        <button id="delete-button" class="btn btn-danger">
                            <i class="fas fa-trash"></i> {{ __('Delete') }}
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <div id="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    
                    <div id="template-content" class="d-none">
                        <p class="lead" id="template-description"></p>
                        
                        <hr>
                        
                        <div class="mb-5">
                            <h5>{{ __('Objective') }}</h5>
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title" id="objective-title"></h5>
                                    <p class="card-text" id="objective-description"></p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-5">
                            <h5>{{ __('Key Results') }}</h5>
                            <div class="row" id="key-results-container">
                                <!-- Key results will be loaded here -->
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h5>{{ __('Initiatives') }}</h5>
                            <div class="row" id="initiatives-container">
                                <!-- Initiatives will be loaded here -->
                            </div>
                        </div>
                        
                        <div class="text-end mt-5">
                            <button id="use-template-button" class="btn btn-success">
                                <i class="fas fa-check"></i> {{ __('Use This Template') }}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer text-muted">
                    <div class="row">
                        <div class="col-md-6">
                            {{ __('Created by') }}: <span id="creator-name">-</span>
                        </div>
                        <div class="col-md-6 text-md-end">
                            {{ __('Created on') }}: <span id="created-date">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Key Result Template -->
<template id="key-result-template">
    <div class="col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-body">
                <h6 class="card-title key-result-title"></h6>
                <p class="card-text key-result-description"></p>
            </div>
        </div>
    </div>
</template>

<!-- Initiative Template -->
<template id="initiative-template">
    <div class="col-md-6 mb-3">
        <div class="card h-100">
            <div class="card-body">
                <h6 class="card-title initiative-title"></h6>
                <p class="card-text initiative-description"></p>
            </div>
        </div>
    </div>
</template>

<!-- Use Template Modal -->
<div class="modal fade" id="useTemplateModal" tabindex="-1" aria-labelledby="useTemplateModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="useTemplateModalLabel">{{ __('Use Template') }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="use-template-form">
                    <div class="mb-3">
                        <label for="timeframe-select" class="form-label">{{ __('Select Timeframe') }}</label>
                        <select id="timeframe-select" class="form-select" required>
                            <option value="">{{ __('Select a timeframe') }}</option>
                            <!-- Timeframes will be loaded here -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="owner-select" class="form-label">{{ __('Assigned To') }}</label>
                        <select id="owner-select" class="form-select" required>
                            <option value="">{{ __('Select owner') }}</option>
                            <!-- Users will be loaded here -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="team-select" class="form-label">{{ __('Team') }}</label>
                        <select id="team-select" class="form-select" required>
                            <option value="">{{ __('Select team') }}</option>
                            <!-- Teams will be loaded here -->
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                <button type="button" class="btn btn-success" id="confirm-use-template">{{ __('Create OKR') }}</button>
            </div>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Get template ID from the URL
        const templateId = {{ $template_id }};
        
        // Load template data
        loadTemplate(templateId);
        
        // Set up event listeners
        document.getElementById('delete-button').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this template?')) {
                deleteTemplate(templateId);
            }
        });
        
        document.getElementById('use-template-button').addEventListener('click', function() {
            // Load timeframes, users, and teams before showing modal
            loadTimeframes();
            loadUsers();
            loadTeams();
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('useTemplateModal'));
            modal.show();
        });
        
        document.getElementById('confirm-use-template').addEventListener('click', function() {
            useTemplate(templateId);
        });
    });
    
    function loadTemplate(id) {
        fetch(`/api/okr-templates/${id}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Failed to load template: ' + data.message);
                window.location.href = '/templates';
                return;
            }
            
            const template = data.data;
            
            // Update template details
            document.getElementById('template-name').textContent = template.name;
            document.getElementById('template-description').textContent = template.description;
            document.getElementById('template-department').textContent = template.department;
            document.getElementById('template-category').textContent = template.category;
            document.getElementById('created-date').textContent = new Date(template.created_at).toLocaleDateString();
            
            // Show AI badge if AI generated
            if (template.is_ai_generated) {
                document.getElementById('ai-badge').classList.remove('d-none');
            }
            
            // Set creator name if available
            if (template.creator) {
                document.getElementById('creator-name').textContent = template.creator.name;
            }
            
            // Set edit link
            document.getElementById('edit-link').href = `/templates/${template.id}/edit`;
            
            // Render objective
            document.getElementById('objective-title').textContent = template.template_data.objective.title;
            document.getElementById('objective-description').textContent = template.template_data.objective.description;
            
            // Render key results
            const keyResultsContainer = document.getElementById('key-results-container');
            keyResultsContainer.innerHTML = '';
            
            template.template_data.key_results.forEach((kr, index) => {
                const template = document.getElementById('key-result-template');
                const clone = document.importNode(template.content, true);
                
                clone.querySelector('.key-result-title').textContent = `KR${index + 1}: ${kr.title}`;
                clone.querySelector('.key-result-description').textContent = kr.description;
                
                keyResultsContainer.appendChild(clone);
            });
            
            // Render initiatives
            const initiativesContainer = document.getElementById('initiatives-container');
            initiativesContainer.innerHTML = '';
            
            template.template_data.initiatives.forEach((initiative, index) => {
                const template = document.getElementById('initiative-template');
                const clone = document.importNode(template.content, true);
                
                clone.querySelector('.initiative-title').textContent = `Initiative ${index + 1}: ${initiative.title}`;
                clone.querySelector('.initiative-description').textContent = initiative.description;
                
                initiativesContainer.appendChild(clone);
            });
            
            // Hide loading, show content
            document.getElementById('loading').classList.add('d-none');
            document.getElementById('template-content').classList.remove('d-none');
        })
        .catch(error => {
            console.error('Error loading template:', error);
            alert('Failed to load template. Please try again.');
        });
    }
    
    function deleteTemplate(id) {
        fetch(`/api/okr-templates/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Template deleted successfully');
                window.location.href = '/templates';
            } else {
                alert('Failed to delete template: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting template:', error);
            alert('Failed to delete template. Please try again.');
        });
    }
    
    function loadTimeframes() {
        fetch('/api/timeframes/active', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('timeframe-select');
            select.innerHTML = '<option value="">Select a timeframe</option>';
            
            data.data.forEach(timeframe => {
                const option = document.createElement('option');
                option.value = timeframe.id;
                option.textContent = `${timeframe.name} (${new Date(timeframe.start_date).toLocaleDateString()} - ${new Date(timeframe.end_date).toLocaleDateString()})`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading timeframes:', error);
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
            const select = document.getElementById('owner-select');
            select.innerHTML = '<option value="">Select owner</option>';
            
            data.data.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading users:', error);
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
            select.innerHTML = '<option value="">Select team</option>';
            
            data.data.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading teams:', error);
        });
    }
    
    function useTemplate(templateId) {
        const timeframeId = document.getElementById('timeframe-select').value;
        const ownerId = document.getElementById('owner-select').value;
        const teamId = document.getElementById('team-select').value;
        
        if (!timeframeId || !ownerId || !teamId) {
            alert('Please select a timeframe, owner, and team');
            return;
        }
        
        fetch(`/api/okr-templates/${templateId}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                timeframe_id: timeframeId,
                owner_id: ownerId,
                team_id: teamId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('OKR created successfully');
                window.location.href = `/objectives/${data.data.id}`;
            } else {
                alert('Failed to create OKR: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error using template:', error);
            alert('Failed to create OKR. Please try again.');
        });
    }
</script>
@endsection