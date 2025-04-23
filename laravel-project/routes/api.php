<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ObjectiveController;
use App\Http\Controllers\Api\KeyResultController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TimeframeController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\OkrTemplateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CadenceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// User endpoints
Route::get('/user', [UserController::class, 'current']);
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);

// Objectives endpoints
Route::get('/objectives', [ObjectiveController::class, 'index']);
Route::post('/objectives', [ObjectiveController::class, 'store']);
Route::get('/objectives/{id}', [ObjectiveController::class, 'show']);
Route::put('/objectives/{id}', [ObjectiveController::class, 'update']);
Route::delete('/objectives/{id}', [ObjectiveController::class, 'destroy']);
Route::get('/objectives/my', [ObjectiveController::class, 'myObjectives']);
Route::get('/objectives/team', [ObjectiveController::class, 'teamObjectives']);
Route::post('/objectives/generate', [ObjectiveController::class, 'generateFromTemplate']);

// Key Results endpoints
Route::get('/key-results', [KeyResultController::class, 'index']);
Route::post('/key-results', [KeyResultController::class, 'store']);
Route::get('/key-results/{id}', [KeyResultController::class, 'show']);
Route::put('/key-results/{id}', [KeyResultController::class, 'update']);
Route::delete('/key-results/{id}', [KeyResultController::class, 'destroy']);
Route::get('/key-results/by-objective/{objectiveId}', [KeyResultController::class, 'byObjective']);

// Teams endpoints
Route::get('/teams', [TeamController::class, 'index']);
Route::post('/teams', [TeamController::class, 'store']);
Route::get('/teams/{id}', [TeamController::class, 'show']);
Route::put('/teams/{id}', [TeamController::class, 'update']);
Route::delete('/teams/{id}', [TeamController::class, 'destroy']);
Route::get('/teams/my', [TeamController::class, 'myTeams']);
Route::get('/teams/departments', [TeamController::class, 'departments']);
Route::post('/teams/{id}/members', [TeamController::class, 'addMember']);
Route::put('/teams/{id}/members/{userId}', [TeamController::class, 'updateMember']);
Route::delete('/teams/{id}/members/{userId}', [TeamController::class, 'removeMember']);

// Timeframes endpoints
Route::get('/timeframes', [TimeframeController::class, 'index']);
Route::post('/timeframes', [TimeframeController::class, 'store']);
Route::get('/timeframes/{id}', [TimeframeController::class, 'show']);
Route::put('/timeframes/{id}', [TimeframeController::class, 'update']);
Route::delete('/timeframes/{id}', [TimeframeController::class, 'destroy']);
Route::get('/timeframes/active', [TimeframeController::class, 'active']);

// Cadences endpoints
Route::get('/cadences', [CadenceController::class, 'index']);
Route::post('/cadences', [CadenceController::class, 'store']);
Route::get('/cadences/{id}', [CadenceController::class, 'show']);
Route::put('/cadences/{id}', [CadenceController::class, 'update']);
Route::delete('/cadences/{id}', [CadenceController::class, 'destroy']);

// Check-ins endpoints
Route::get('/check-ins', [CheckInController::class, 'index']);
Route::post('/check-ins', [CheckInController::class, 'store']);
Route::get('/check-ins/{id}', [CheckInController::class, 'show']);
Route::delete('/check-ins/{id}', [CheckInController::class, 'destroy']);
Route::get('/check-ins/my', [CheckInController::class, 'myCheckIns']);
Route::get('/check-ins/by-objective/{objectiveId}', [CheckInController::class, 'byObjective']);
Route::get('/check-ins/by-key-result/{keyResultId}', [CheckInController::class, 'byKeyResult']);

// OKR Templates endpoints
Route::get('/okr-templates', [OkrTemplateController::class, 'index']);
Route::post('/okr-templates', [OkrTemplateController::class, 'store']);
Route::get('/okr-templates/{id}', [OkrTemplateController::class, 'show']);
Route::put('/okr-templates/{id}', [OkrTemplateController::class, 'update']);
Route::delete('/okr-templates/{id}', [OkrTemplateController::class, 'destroy']);
Route::post('/okr-templates/generate', [OkrTemplateController::class, 'generateWithAi']);
Route::get('/okr-templates/categories', [OkrTemplateController::class, 'categories']);
Route::get('/okr-templates/departments', [OkrTemplateController::class, 'departments']);