@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="h4 m-0">{{ __('OKR Templates') }}</span>
                    <a href="{{ route('templates.create') }}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> {{ __('Create Template') }}
                    </a>
                </div>

                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" id="search-input" class="form-control" placeholder="Search templates...">
                                <button class="btn btn-outline-secondary" type="button" id="search-button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select id="department-filter" class="form-select">
                                <option value="">All Departments</option>
                                <!-- Departments will be loaded here -->
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select id="category-filter" class="form-select">
                                <option value="">All Categories</option>
                                <!-- Categories will be loaded here -->
                            </select>
                        </div>
                        <div class="col-md-2">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="ai-filter">
                                <label class="form-check-label" for="ai-filter">AI Generated</label>
                            </div>
                        </div>
                    </div>

                    <div class="row" id="templates-container">
                        <!-- Templates will be loaded here -->
                        <div class="col-12 text-center py-5" id="loading">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div class="col-12 text-center py-5 d-none" id="no-templates">
                            <p class="text-muted">No templates found. Create one or try a different search.</p>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div id="pagination" class="d-flex justify-content-center">
                                <!-- Pagination will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row justify-content-center mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="h4 m-0">{{ __('One-Click OKR Template Generator') }}</span>
                </div>

                <div class="card-body">
                    <form id="ai-generator-form">
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <label for="ai-description" class="form-label">{{ __('Describe your goal or objective') }}</label>
                                <textarea id="ai-description" name="description" class="form-control" rows="3" placeholder="E.g., Improve customer satisfaction and retention for our SaaS product..." required></textarea>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="ai-department" class="form-label">{{ __('Department') }}</label>
                                <select id="ai-department" name="department" class="form-select" required>
                                    <option value="">Select Department</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Product">Product</option>
                                    <option value="Customer Success">Customer Success</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Human Resources">Human Resources</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="ai-level" class="form-label">{{ __('OKR Level') }}</label>
                                <select id="ai-level" name="level" class="form-select" required>
                                    <option value="company">Company</option>
                                    <option value="department">Department</option>
                                    <option value="team" selected>Team</option>
                                    <option value="individual">Individual</option>
                                </select>
                            </div>
                            <div class="col-md-2 mb-3">
                                <label for="ai-save" class="form-label">{{ __('Save Template?') }}</label>
                                <div class="form-check form-switch mt-2">
                                    <input class="form-check-input" type="checkbox" id="ai-save" name="save" checked>
                                    <label class="form-check-label" for="ai-save">Yes</label>
                                </div>
                            </div>
                            <div class="col-12 text-end">
                                <button type="submit" class="btn btn-success" id="generate-button">
                                    <i class="fas fa-wand-magic-sparkles"></i> {{ __('Generate OKR Template') }}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div class="mt-4 d-none" id="ai-result-container">
                        <hr>
                        <h5>Generated Template</h5>
                        <div id="ai-result-content" class="bg-light p-3 rounded">
                            <!-- AI generated content will be displayed here -->
                        </div>
                        <div class="text-end mt-3">
                            <button type="button" class="btn btn-outline-secondary me-2" id="edit-template-button">
                                <i class="fas fa-edit"></i> {{ __('Edit Template') }}
                            </button>
                            <button type="button" class="btn btn-primary" id="use-template-button">
                                <i class="fas fa-check"></i> {{ __('Use Template') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Template Card Template -->
<template id="template-card">
    <div class="col-md-4 mb-4 template-card">
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span class="template-name text-truncate" style="max-width: 80%;"></span>
                <span class="badge bg-info ai-badge d-none">AI</span>
            </div>
            <div class="card-body">
                <p class="template-description"></p>
                <div class="mb-2">
                    <span class="badge bg-primary template-department"></span>
                    <span class="badge bg-secondary template-category ms-1"></span>
                </div>
            </div>
            <div class="card-footer d-flex justify-content-between">
                <small class="text-muted template-date"></small>
                <div>
                    <a href="#" class="btn btn-sm btn-outline-primary view-template">
                        <i class="fas fa-eye"></i>
                    </a>
                    <a href="#" class="btn btn-sm btn-outline-secondary edit-template">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button class="btn btn-sm btn-outline-danger delete-template">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Load templates when page loads
        loadTemplates();
        
        // Load filter options
        loadDepartments();
        loadCategories();
        
        // Filter change event listeners
        document.getElementById('department-filter').addEventListener('change', loadTemplates);
        document.getElementById('category-filter').addEventListener('change', loadTemplates);
        document.getElementById('ai-filter').addEventListener('change', loadTemplates);
        
        // Search button click
        document.getElementById('search-button').addEventListener('click', loadTemplates);
        
        // Search input enter key
        document.getElementById('search-input').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadTemplates();
            }
        });
        
        // AI Generator form submit
        document.getElementById('ai-generator-form').addEventListener('submit', function(event) {
            event.preventDefault();
            generateTemplate();
        });
        
        // Edit generated template button
        document.getElementById('edit-template-button').addEventListener('click', function() {
            // Redirect to edit page with template data
            // Implementation depends on how you want to handle this
        });
        
        // Use generated template button
        document.getElementById('use-template-button').addEventListener('click', function() {
            // Redirect to create objective page with template data
            // Implementation depends on how you want to handle this
        });
    });
    
    function loadTemplates(page = 1) {
        const container = document.getElementById('templates-container');
        const loading = document.getElementById('loading');
        const noTemplates = document.getElementById('no-templates');
        
        // Show loading, hide no templates message
        loading.classList.remove('d-none');
        noTemplates.classList.add('d-none');
        
        // Clear existing templates
        const existingCards = container.querySelectorAll('.template-card');
        existingCards.forEach(card => card.remove());
        
        // Get filter values
        const department = document.getElementById('department-filter').value;
        const category = document.getElementById('category-filter').value;
        const aiGenerated = document.getElementById('ai-filter').checked;
        const search = document.getElementById('search-input').value;
        
        // Fetch templates from API
        fetch(`/api/okr-templates?page=${page}&department=${department}&category=${category}&ai_generated=${aiGenerated ? 1 : 0}&search=${search}`, {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            loading.classList.add('d-none');
            
            if (data.data.data.length === 0) {
                noTemplates.classList.remove('d-none');
                return;
            }
            
            // Render templates
            data.data.data.forEach(template => {
                renderTemplateCard(template);
            });
            
            // Render pagination
            renderPagination(data.data);
        })
        .catch(error => {
            console.error('Error loading templates:', error);
            loading.classList.add('d-none');
            alert('Failed to load templates. Please try again.');
        });
    }
    
    function renderTemplateCard(template) {
        const container = document.getElementById('templates-container');
        const templateCard = document.getElementById('template-card');
        const clone = document.importNode(templateCard.content, true);
        
        // Fill in template data
        clone.querySelector('.template-name').textContent = template.name;
        clone.querySelector('.template-description').textContent = template.description;
        clone.querySelector('.template-department').textContent = template.department;
        clone.querySelector('.template-category').textContent = template.category;
        clone.querySelector('.template-date').textContent = 'Created: ' + new Date(template.created_at).toLocaleDateString();
        
        // Show AI badge if AI generated
        if (template.is_ai_generated) {
            clone.querySelector('.ai-badge').classList.remove('d-none');
        }
        
        // Set up action buttons
        clone.querySelector('.view-template').href = `/templates/${template.id}`;
        clone.querySelector('.edit-template').href = `/templates/${template.id}/edit`;
        
        // Delete button click handler
        clone.querySelector('.delete-template').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this template?')) {
                deleteTemplate(template.id);
            }
        });
        
        container.appendChild(clone);
    }
    
    function renderPagination(data) {
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
                loadTemplates(data.current_page - 1);
            }
        });
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= data.last_page; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${data.current_page === i ? 'active' : ''}`;
            const link = document.createElement('a');
            link.className = 'page-link';
            link.href = '#';
            link.textContent = i;
            link.addEventListener('click', function(e) {
                e.preventDefault();
                loadTemplates(i);
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
                loadTemplates(data.current_page + 1);
            }
        });
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        pagination.appendChild(ul);
    }
    
    function loadDepartments() {
        fetch('/api/okr-templates/departments', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('department-filter');
            data.data.forEach(department => {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading departments:', error);
        });
    }
    
    function loadCategories() {
        fetch('/api/okr-templates/categories', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('category-filter');
            data.data.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading categories:', error);
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
                loadTemplates();
            } else {
                alert('Failed to delete template: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting template:', error);
            alert('Failed to delete template. Please try again.');
        });
    }
    
    function generateTemplate() {
        const generateButton = document.getElementById('generate-button');
        const resultContainer = document.getElementById('ai-result-container');
        const resultContent = document.getElementById('ai-result-content');
        
        // Disable button and show loading
        generateButton.disabled = true;
        generateButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
        
        // Get form data
        const description = document.getElementById('ai-description').value;
        const department = document.getElementById('ai-department').value;
        const level = document.getElementById('ai-level').value;
        const save = document.getElementById('ai-save').checked;
        
        // Call API to generate template
        fetch('/api/okr-templates/ai-generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({
                description: description,
                department: department,
                level: level,
                save: save
            })
        })
        .then(response => response.json())
        .then(data => {
            // Re-enable button
            generateButton.disabled = false;
            generateButton.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate OKR Template';
            
            if (!data.success) {
                alert('Failed to generate template: ' + data.message);
                return;
            }
            
            // Show result container
            resultContainer.classList.remove('d-none');
            
            // Format and display the template
            const template = data.data;
            let html = `
                <h4>${template.name}</h4>
                <p>${template.description}</p>
                <div class="mb-3">
                    <span class="badge bg-primary">${template.department}</span>
                    <span class="badge bg-secondary ms-1">${template.category || 'AI Generated'}</span>
                </div>
                <div class="objective mb-4">
                    <h5>Objective</h5>
                    <div class="card mb-2">
                        <div class="card-body">
                            <h6>${template.template_data.objective.title}</h6>
                            <p>${template.template_data.objective.description}</p>
                        </div>
                    </div>
                </div>
                <div class="key-results mb-4">
                    <h5>Key Results</h5>
                    <div class="row">
            `;
            
            template.template_data.key_results.forEach((kr, index) => {
                html += `
                    <div class="col-md-6 mb-2">
                        <div class="card h-100">
                            <div class="card-body">
                                <h6>KR${index + 1}: ${kr.title}</h6>
                                <p>${kr.description}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
                <div class="initiatives">
                    <h5>Initiatives</h5>
                    <div class="row">
            `;
            
            template.template_data.initiatives.forEach((initiative, index) => {
                html += `
                    <div class="col-md-6 mb-2">
                        <div class="card h-100">
                            <div class="card-body">
                                <h6>Initiative ${index + 1}: ${initiative.title}</h6>
                                <p>${initiative.description}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            resultContent.innerHTML = html;
            
            // If saved, reload templates list
            if (save) {
                loadTemplates();
            }
        })
        .catch(error => {
            console.error('Error generating template:', error);
            generateButton.disabled = false;
            generateButton.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate OKR Template';
            alert('Failed to generate template. Please try again.');
        });
    }
</script>
@endsection