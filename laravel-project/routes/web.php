<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');

// OKR Templates routes - protected by auth middleware
Route::middleware(['auth'])->group(function () {
    Route::get('/templates', function () {
        return view('templates.index');
    })->name('templates.index');
    
    Route::get('/templates/create', function () {
        return view('templates.create');
    })->name('templates.create');
    
    Route::get('/templates/{id}', function ($id) {
        return view('templates.show', ['template_id' => $id]);
    })->name('templates.show');
});
