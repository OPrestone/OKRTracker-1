<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ObjectiveController;
use App\Http\Controllers\KeyResultController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TimeframeController;
use App\Http\Controllers\CadenceController;
use App\Http\Controllers\InitiativeController;
use App\Http\Controllers\CheckInController;

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

Route::middleware('auth:sanctum')->group(function () {
    // User info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Objectives
    Route::apiResource('objectives', ObjectiveController::class);
    Route::put('objectives/{id}/progress', [ObjectiveController::class, 'updateProgress']);

    // Key Results
    Route::apiResource('key-results', KeyResultController::class);
    Route::put('key-results/{id}/progress', [KeyResultController::class, 'updateProgress']);

    // Teams
    Route::apiResource('teams', TeamController::class);
    Route::post('teams/{id}/members', [TeamController::class, 'addMember']);
    Route::delete('teams/{id}/members/{userId}', [TeamController::class, 'removeMember']);
    Route::put('teams/{id}/members/{userId}', [TeamController::class, 'updateMemberRole']);

    // Timeframes
    Route::apiResource('timeframes', TimeframeController::class);
    Route::get('timeframes/active', [TimeframeController::class, 'getActive']);

    // Cadences
    Route::apiResource('cadences', CadenceController::class);
    Route::post('cadences/{id}/generate-timeframe', [CadenceController::class, 'generateNextTimeframe']);

    // Initiatives
    Route::apiResource('initiatives', InitiativeController::class);
    Route::put('initiatives/{id}/complete', [InitiativeController::class, 'markComplete']);

    // Check-ins
    Route::apiResource('check-ins', CheckInController::class);
    Route::get('check-ins/recent', [CheckInController::class, 'getRecent']);
    Route::get('check-ins/by-objective/{objectiveId}', [CheckInController::class, 'getByObjective']);
    Route::get('check-ins/by-key-result/{keyResultId}', [CheckInController::class, 'getByKeyResult']);
});