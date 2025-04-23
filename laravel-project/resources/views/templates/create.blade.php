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
                <div class="card-header">
                    <h4 class="m-0">{{ __('Create OKR Template') }}</h4>
                </div>

                <div class="card-body">
                    <form id="create-template-form">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="template-name" class="form-label">{{ __('Template Name') }} <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="template-name" name="name" required>
                                    <div class="invalid-feedback" id="name-error"></div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="template-description" class="form-label">{{ __('Description') }} <span class="text-danger">*</span></label>
                                    <textarea class="form-control" id="template-description" name="description" rows="3" required></textarea>
                                    <div class="invalid-feedback" id="description-error"></div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="template-department" class="form-label">{{ __('Department') }} <span class="text-danger">*</span></label>
                                            <select class="form-select" id="template-department" name="department" required>
                                                <option value="">{{ __('Select Department') }}</option>
                                                <option value="Sales">{{ __('Sales') }}</option>
                                                <option value="Marketing">{{ __('Marketing') }}</option>
                                                <option value="Engineering">{{ __('Engineering') }}</option>
                                                <option value="Product">{{ __('Product') }}</option>
                                                <option value="Customer Success">{{ __('Customer Success') }}</option>
                                                <option value="Finance">{{ __('Finance') }}</option>
                                                <option value="Human Resources">{{ __('Human Resources') }}</option>
                                                <option value="Operations">{{ __('Operations') }}</option>
                                            </select>
                                            <div class="invalid-feedback" id="department-error"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="template-category" class="form-label">{{ __('Category') }} <span class="text-danger">*</span></label>
                                            <select class="form-select" id="template-category" name="category" required>
                                                <option value="">{{ __('Select Category') }}</option>
                                                <option value="Growth">{{ __('Growth') }}</option>
                                                <option value="Revenue">{{ __('Revenue') }}</option>
                                                <option value="Product">{{ __('Product') }}</option>
                                                <option value="Customer">{{ __('Customer') }}</option>
                                                <option value="Culture">{{ __('Culture') }}</option>
                                                <option value="Process">{{ __('Process') }}</option>
                                                <option value="Innovation">{{ __('Innovation') }}</option>
                                                <option value="Quality">{{ __('Quality') }}</option>
                                            </select>
                                            <div class="invalid-feedback" id="category-error"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">{{ __('Template Guidelines') }}</h5>
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item">
                                                <strong>Objectives</strong> should be clear, concise, and aligned with high-level goals.
                                            </li>
                                            <li class="list-group-item">
                                                <strong>Key Results</strong> should be measurable and include specific targets (use [X] as placeholders).
                                            </li>
                                            <li class="list-group-item">
                                                <strong>Initiatives</strong> should outline actionable tasks to achieve key results.
                                            </li>
                                            <li class="list-group-item">
                                                A good template can be reused and adapted across different timeframes.
                                            </li>
                                            <li class="list-group-item">
                                                Templates should focus on outcomes rather than outputs.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-4">
                            <h5>{{ __('Objective') }} <span class="text-danger">*</span></h5>
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label for="objective-title" class="form-label">{{ __('Objective Title') }}</label>
                                        <input type="text" class="form-control" id="objective-title" name="objective_title" required>
                                        <div class="invalid-feedback" id="objective-title-error"></div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="objective-level" class="form-label">{{ __('Level') }}</label>
                                        <select class="form-select" id="objective-level" name="objective_level" required>
                                            <option value="company">{{ __('Company') }}</option>
                                            <option value="department">{{ __('Department') }}</option>
                                            <option value="team" selected>{{ __('Team') }}</option>
                                            <option value="individual">{{ __('Individual') }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="objective-description" class="form-label">{{ __('Objective Description') }}</label>
                                <textarea class="form-control" id="objective-description" name="objective_description" rows="2"></textarea>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5>{{ __('Key Results') }} <span class="text-danger">*</span></h5>
                                <button type="button" class="btn btn-outline-primary btn-sm" id="add-key-result">
                                    <i class="fas fa-plus"></i> {{ __('Add Key Result') }}
                                </button>
                            </div>
                            
                            <div id="key-results-container">
                                <!-- Initial key result -->
                                <div class="card mb-3 key-result-card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="card-title m-0">{{ __('Key Result') }} 1</h6>
                                            <button type="button" class="btn btn-outline-danger btn-sm remove-key-result" disabled>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">{{ __('Key Result Title') }}</label>
                                            <input type="text" class="form-control key-result-title" name="key_result_title[]" placeholder="e.g., Increase conversion rate by [X]%" required>
                                        </div>
                                        <div class="mb-0">
                                            <label class="form-label">{{ __('Key Result Description') }}</label>
                                            <textarea class="form-control key-result-description" name="key_result_description[]" rows="2" placeholder="Provide more details about this key result..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5>{{ __('Initiatives') }}</h5>
                                <button type="button" class="btn btn-outline-primary btn-sm" id="add-initiative">
                                    <i class="fas fa-plus"></i> {{ __('Add Initiative') }}
                                </button>
                            </div>
                            
                            <div id="initiatives-container">
                                <!-- Initial initiative -->
                                <div class="card mb-3 initiative-card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="card-title m-0">{{ __('Initiative') }} 1</h6>
                                            <button type="button" class="btn btn-outline-danger btn-sm remove-initiative" disabled>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">{{ __('Initiative Title') }}</label>
                                            <input type="text" class="form-control initiative-title" name="initiative_title[]" placeholder="e.g., Implement A/B testing framework" required>
                                        </div>
                                        <div class="mb-0">
                                            <label class="form-label">{{ __('Initiative Description') }}</label>
                                            <textarea class="form-control initiative-description" name="initiative_description[]" rows="2" placeholder="Provide more details about this initiative..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between mt-4">
                            <button type="button" class="btn btn-outline-secondary" onclick="window.location.href='{{ route('templates.index') }}'">
                                {{ __('Cancel') }}
                            </button>
                            <button type="submit" class="btn btn-primary" id="submit-button">
                                {{ __('Create Template') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Key Result Template for cloning -->
<template id="key-result-template">
    <div class="card mb-3 key-result-card">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="card-title m-0">{{ __('Key Result') }} <span class="key-result-number"></span></h6>
                <button type="button" class="btn btn-outline-danger btn-sm remove-key-result">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-3">
                <label class="form-label">{{ __('Key Result Title') }}</label>
                <input type="text" class="form-control key-result-title" name="key_result_title[]" placeholder="e.g., Increase conversion rate by [X]%" required>
            </div>
            <div class="mb-0">
                <label class="form-label">{{ __('Key Result Description') }}</label>
                <textarea class="form-control key-result-description" name="key_result_description[]" rows="2" placeholder="Provide more details about this key result..."></textarea>
            </div>
        </div>
    </div>
</template>

<!-- Initiative Template for cloning -->
<template id="initiative-template">
    <div class="card mb-3 initiative-card">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="card-title m-0">{{ __('Initiative') }} <span class="initiative-number"></span></h6>
                <button type="button" class="btn btn-outline-danger btn-sm remove-initiative">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-3">
                <label class="form-label">{{ __('Initiative Title') }}</label>
                <input type="text" class="form-control initiative-title" name="initiative_title[]" placeholder="e.g., Implement A/B testing framework" required>
            </div>
            <div class="mb-0">
                <label class="form-label">{{ __('Initiative Description') }}</label>
                <textarea class="form-control initiative-description" name="initiative_description[]" rows="2" placeholder="Provide more details about this initiative..."></textarea>
            </div>
        </div>
    </div>
</template>

@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Add Key Result button click handler
        document.getElementById('add-key-result').addEventListener('click', function() {
            addKeyResult();
        });
        
        // Add Initiative button click handler
        document.getElementById('add-initiative').addEventListener('click', function() {
            addInitiative();
        });
        
        // Form submit handler
        document.getElementById('create-template-form').addEventListener('submit', function(event) {
            event.preventDefault();
            submitForm();
        });
        
        // Add event delegation for remove buttons
        document.addEventListener('click', function(event) {
            if (event.target.closest('.remove-key-result')) {
                event.preventDefault();
                removeKeyResult(event.target.closest('.key-result-card'));
            }
            
            if (event.target.closest('.remove-initiative')) {
                event.preventDefault();
                removeInitiative(event.target.closest('.initiative-card'));
            }
        });
    });
    
    function addKeyResult() {
        const container = document.getElementById('key-results-container');
        const template = document.getElementById('key-result-template');
        const clone = document.importNode(template.content, true);
        
        // Set key result number
        const keyResultCount = container.querySelectorAll('.key-result-card').length + 1;
        clone.querySelector('.key-result-number').textContent = keyResultCount;
        
        // Enable removal of first key result
        if (keyResultCount === 2) {
            container.querySelector('.remove-key-result').removeAttribute('disabled');
        }
        
        container.appendChild(clone);
    }
    
    function removeKeyResult(element) {
        const container = document.getElementById('key-results-container');
        const keyResults = container.querySelectorAll('.key-result-card');
        
        // Don't allow removing if only one left
        if (keyResults.length <= 1) {
            return;
        }
        
        // Remove the key result card
        element.remove();
        
        // Update numbering
        const remainingKeyResults = container.querySelectorAll('.key-result-card');
        remainingKeyResults.forEach((kr, index) => {
            kr.querySelector('h6').textContent = 'Key Result ' + (index + 1);
        });
        
        // Disable remove button on first key result if only one left
        if (remainingKeyResults.length === 1) {
            remainingKeyResults[0].querySelector('.remove-key-result').setAttribute('disabled', 'disabled');
        }
    }
    
    function addInitiative() {
        const container = document.getElementById('initiatives-container');
        const template = document.getElementById('initiative-template');
        const clone = document.importNode(template.content, true);
        
        // Set initiative number
        const initiativeCount = container.querySelectorAll('.initiative-card').length + 1;
        clone.querySelector('.initiative-number').textContent = initiativeCount;
        
        // Enable removal of first initiative
        if (initiativeCount === 2) {
            container.querySelector('.remove-initiative').removeAttribute('disabled');
        }
        
        container.appendChild(clone);
    }
    
    function removeInitiative(element) {
        const container = document.getElementById('initiatives-container');
        const initiatives = container.querySelectorAll('.initiative-card');
        
        // Don't allow removing if only one left
        if (initiatives.length <= 1) {
            return;
        }
        
        // Remove the initiative card
        element.remove();
        
        // Update numbering
        const remainingInitiatives = container.querySelectorAll('.initiative-card');
        remainingInitiatives.forEach((init, index) => {
            init.querySelector('h6').textContent = 'Initiative ' + (index + 1);
        });
        
        // Disable remove button on first initiative if only one left
        if (remainingInitiatives.length === 1) {
            remainingInitiatives[0].querySelector('.remove-initiative').setAttribute('disabled', 'disabled');
        }
    }
    
    function submitForm() {
        // Clear previous validation errors
        clearValidationErrors();
        
        // Get form data
        const name = document.getElementById('template-name').value;
        const description = document.getElementById('template-description').value;
        const department = document.getElementById('template-department').value;
        const category = document.getElementById('template-category').value;
        
        const objectiveTitle = document.getElementById('objective-title').value;
        const objectiveDescription = document.getElementById('objective-description').value;
        const objectiveLevel = document.getElementById('objective-level').value;
        
        const keyResultTitles = Array.from(document.querySelectorAll('.key-result-title')).map(el => el.value);
        const keyResultDescriptions = Array.from(document.querySelectorAll('.key-result-description')).map(el => el.value);
        
        const initiativeTitles = Array.from(document.querySelectorAll('.initiative-title')).map(el => el.value);
        const initiativeDescriptions = Array.from(document.querySelectorAll('.initiative-description')).map(el => el.value);
        
        // Construct template data
        const templateData = {
            name: name,
            description: description,
            category: category,
            department: department,
            template_data: {
                objective: {
                    title: objectiveTitle,
                    description: objectiveDescription,
                    level: objectiveLevel
                },
                key_results: keyResultTitles.map((title, index) => ({
                    title: title,
                    description: keyResultDescriptions[index] || ''
                })),
                initiatives: initiativeTitles.map((title, index) => ({
                    title: title,
                    description: initiativeDescriptions[index] || ''
                }))
            }
        };
        
        // Disable submit button and show loading
        const submitButton = document.getElementById('submit-button');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
        
        // Submit to API
        fetch('/api/okr-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(templateData)
        })
        .then(response => response.json())
        .then(data => {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            if (data.success) {
                alert('Template created successfully');
                window.location.href = `/templates/${data.data.id}`;
            } else {
                // Handle validation errors
                if (data.errors) {
                    handleValidationErrors(data.errors);
                } else {
                    alert('Failed to create template: ' + data.message);
                }
            }
        })
        .catch(error => {
            console.error('Error creating template:', error);
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            alert('Failed to create template. Please try again.');
        });
    }
    
    function clearValidationErrors() {
        document.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });
        
        document.querySelectorAll('.invalid-feedback').forEach(element => {
            element.textContent = '';
        });
    }
    
    function handleValidationErrors(errors) {
        if (errors.name) {
            document.getElementById('template-name').classList.add('is-invalid');
            document.getElementById('name-error').textContent = errors.name[0];
        }
        
        if (errors.description) {
            document.getElementById('template-description').classList.add('is-invalid');
            document.getElementById('description-error').textContent = errors.description[0];
        }
        
        if (errors.department) {
            document.getElementById('template-department').classList.add('is-invalid');
            document.getElementById('department-error').textContent = errors.department[0];
        }
        
        if (errors.category) {
            document.getElementById('template-category').classList.add('is-invalid');
            document.getElementById('category-error').textContent = errors.category[0];
        }
        
        if (errors['template_data.objective.title']) {
            document.getElementById('objective-title').classList.add('is-invalid');
            document.getElementById('objective-title-error').textContent = errors['template_data.objective.title'][0];
        }
        
        // Scroll to first error
        document.querySelector('.is-invalid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
</script>
@endsection