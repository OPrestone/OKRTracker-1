<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>OKR Management Platform</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Custom CSS -->
    <style>
        :root {
            --primary-color: #4361ee;
            --secondary-color: #3f37c9;
            --success-color: #4cc9f0;
            --info-color: #4895ef;
            --warning-color: #f72585;
            --danger-color: #ff4d6d;
            --light-color: #f8f9fa;
            --dark-color: #212529;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
        }
        
        .navbar-brand {
            font-weight: bold;
            color: var(--primary-color) !important;
        }
        
        .nav-link.active {
            font-weight: bold;
            color: var(--primary-color) !important;
        }
        
        .sidebar {
            position: fixed;
            top: 56px;
            bottom: 0;
            left: 0;
            z-index: 100;
            padding: 48px 0 0;
            box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
            background-color: #fff;
        }
        
        .sidebar-sticky {
            position: relative;
            top: 0;
            height: calc(100vh - 48px);
            padding-top: .5rem;
            overflow-x: hidden;
            overflow-y: auto;
        }
        
        .sidebar .nav-link {
            font-weight: 500;
            color: #333;
            padding: .5rem 1rem;
        }
        
        .sidebar .nav-link.active {
            color: var(--primary-color);
        }
        
        .sidebar .nav-link:hover {
            color: var(--primary-color);
        }
        
        .sidebar .nav-link .feather {
            margin-right: 4px;
        }
        
        .main-content {
            margin-left: 240px;
            padding: 2rem;
        }
        
        @media (max-width: 767.98px) {
            .sidebar {
                top: 0;
                width: 100%;
                position: static;
                height: auto;
                padding: 0;
            }
            
            .main-content {
                margin-left: 0;
                padding: 1rem;
            }
        }
        
        .card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: none;
            margin-bottom: 1.5rem;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        .btn-primary:hover {
            background-color: var(--secondary-color);
            border-color: var(--secondary-color);
        }
        
        .badge {
            padding: 0.5em 0.8em;
        }
        
        .progress {
            height: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        /* High-five animation */
        .high-five {
            display: inline-block;
            animation: high-five-anim 0.5s ease;
        }
        
        @keyframes high-five-anim {
            0% { transform: scale(1); }
            50% { transform: scale(1.5); }
            100% { transform: scale(1); }
        }
        
        /* Toast notification */
        .toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        }
    </style>
    
    @yield('styles')
</head>
<body>
    <header>
        <nav class="navbar navbar-expand-md navbar-light bg-white shadow-sm fixed-top">
            <div class="container-fluid">
                <a class="navbar-brand" href="{{ url('/') }}">
                    <i class="fas fa-bullseye me-2"></i> OKR Platform
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <!-- Left Side Of Navbar -->
                    <ul class="navbar-nav me-auto">
                        
                    </ul>
                    
                    <!-- Right Side Of Navbar -->
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item dropdown">
                            <a id="navbarDropdown" class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" v-pre>
                                <i class="fas fa-user-circle me-1"></i> {{ Auth::user()->name ?? 'Guest' }}
                            </a>
                            
                            <div class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                                <a class="dropdown-item" href="/profile">
                                    <i class="fas fa-user me-1"></i> Profile
                                </a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="/logout">
                                    <i class="fas fa-sign-out-alt me-1"></i> Logout
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    
    <div class="container-fluid">
        <div class="row">
            <nav id="sidebar" class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
                <div class="position-sticky sidebar-sticky">
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/dashboard*') ? 'active' : '' }}" href="/dashboard">
                                <i class="fas fa-home me-2"></i> Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/objectives*') ? 'active' : '' }}" href="/objectives">
                                <i class="fas fa-bullseye me-2"></i> Objectives
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/key-results*') ? 'active' : '' }}" href="/key-results">
                                <i class="fas fa-tasks me-2"></i> Key Results
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/check-ins*') ? 'active' : '' }}" href="/check-ins">
                                <i class="fas fa-clipboard-check me-2"></i> Check-ins
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/teams*') ? 'active' : '' }}" href="/teams">
                                <i class="fas fa-users me-2"></i> Teams
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/timeframes*') ? 'active' : '' }}" href="/timeframes">
                                <i class="fas fa-calendar-alt me-2"></i> Timeframes
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/templates*') ? 'active' : '' }}" href="/templates">
                                <i class="fas fa-copy me-2"></i> Templates
                            </a>
                        </li>
                        <li class="nav-item mt-4">
                            <a class="nav-link {{ request()->is('/reports*') ? 'active' : '' }}" href="/reports">
                                <i class="fas fa-chart-bar me-2"></i> Reports
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link {{ request()->is('/settings*') ? 'active' : '' }}" href="/settings">
                                <i class="fas fa-cog me-2"></i> Settings
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
            
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content mt-5 pt-3">
                @yield('content')
            </main>
        </div>
    </div>
    
    <!-- Toast container for notifications -->
    <div class="toast-container"></div>
    
    <!-- Bootstrap JS and Popper.js -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Global app script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Enable all tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            // Handle sidebar toggle for mobile view
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', function() {
                    document.body.classList.toggle('sidebar-collapsed');
                });
            }
            
            // Helper function to show toast notifications
            window.showToast = function(message, type = 'success') {
                const toastContainer = document.querySelector('.toast-container');
                
                const toastEl = document.createElement('div');
                toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
                toastEl.setAttribute('role', 'alert');
                toastEl.setAttribute('aria-live', 'assertive');
                toastEl.setAttribute('aria-atomic', 'true');
                
                const toastFlex = document.createElement('div');
                toastFlex.className = 'd-flex';
                
                const toastBody = document.createElement('div');
                toastBody.className = 'toast-body';
                toastBody.textContent = message;
                
                const closeButton = document.createElement('button');
                closeButton.type = 'button';
                closeButton.className = 'btn-close btn-close-white me-2 m-auto';
                closeButton.setAttribute('data-bs-dismiss', 'toast');
                closeButton.setAttribute('aria-label', 'Close');
                
                toastFlex.appendChild(toastBody);
                toastFlex.appendChild(closeButton);
                toastEl.appendChild(toastFlex);
                toastContainer.appendChild(toastEl);
                
                const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
                toast.show();
                
                // Remove the toast element when hidden
                toastEl.addEventListener('hidden.bs.toast', function() {
                    toastContainer.removeChild(toastEl);
                });
            };
        });
    </script>
    
    @yield('scripts')
</body>
</html>