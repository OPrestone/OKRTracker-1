<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\KeyResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CheckInController extends Controller
{
    /**
     * Display a listing of check-ins.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = CheckIn::with(['user', 'keyResult', 'keyResult.objective']);
        
        // Filter by key result if provided
        if ($request->has('key_result_id') && $request->key_result_id) {
            $query->where('key_result_id', $request->key_result_id);
        }
        
        // Filter by user if provided
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filter by date range if provided
        if ($request->has('start_date') && $request->start_date) {
            $query->where('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date') && $request->end_date) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }
        
        $checkIns = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $checkIns
        ]);
    }

    /**
     * Store a newly created check-in.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key_result_id' => 'required|exists:key_results,id',
            'current_value' => 'required|numeric',
            'note' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Get the key result to get the previous value
            $keyResult = KeyResult::findOrFail($request->key_result_id);
            
            // Create the check-in
            $checkIn = CheckIn::create([
                'key_result_id' => $request->key_result_id,
                'user_id' => Auth::id(),
                'previous_value' => $keyResult->current_value,
                'current_value' => $request->current_value,
                'note' => $request->note,
            ]);
            
            // Update the key result's current value
            $keyResult->current_value = $request->current_value;
            
            // Calculate and update progress
            $this->calculateAndUpdateProgress($keyResult);
            
            // Update objective progress
            $this->updateObjectiveProgress($keyResult->objective_id);
            
            return response()->json([
                'success' => true,
                'message' => 'Check-in created successfully',
                'data' => $checkIn->load(['user', 'keyResult'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating check-in', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create check-in',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified check-in.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $checkIn = CheckIn::with(['user', 'keyResult', 'keyResult.objective'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $checkIn
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Check-in not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified check-in.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'note' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $checkIn = CheckIn::findOrFail($id);
            
            // Only allow updating the note
            $checkIn->update([
                'note' => $request->note,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Check-in updated successfully',
                'data' => $checkIn->load(['user', 'keyResult'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating check-in', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update check-in',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified check-in.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $checkIn = CheckIn::findOrFail($id);
            $keyResultId = $checkIn->key_result_id;
            
            // Get the key result
            $keyResult = KeyResult::findOrFail($keyResultId);
            
            // Check if this is the most recent check-in
            $latestCheckIn = CheckIn::where('key_result_id', $keyResultId)
                ->orderBy('created_at', 'desc')
                ->first();
            
            if ($latestCheckIn->id == $id) {
                // Find the previous check-in
                $previousCheckIn = CheckIn::where('key_result_id', $keyResultId)
                    ->where('id', '!=', $id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                // Revert the key result's current value to the previous check-in value
                if ($previousCheckIn) {
                    $keyResult->current_value = $previousCheckIn->current_value;
                    $keyResult->save();
                    
                    // Calculate and update progress
                    $this->calculateAndUpdateProgress($keyResult);
                    
                    // Update objective progress
                    $this->updateObjectiveProgress($keyResult->objective_id);
                }
            }
            
            $checkIn->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Check-in deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete check-in',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Get the most recent check-ins.
     *
     * @return \Illuminate\Http\Response
     */
    public function getRecent(Request $request)
    {
        $limit = $request->limit ?? 10;
        
        $checkIns = CheckIn::with(['user', 'keyResult', 'keyResult.objective'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $checkIns
        ]);
    }
    
    /**
     * Get check-ins for a specific objective.
     *
     * @param  int  $objectiveId
     * @return \Illuminate\Http\Response
     */
    public function getByObjective($objectiveId)
    {
        $checkIns = CheckIn::with(['user', 'keyResult'])
            ->whereHas('keyResult', function($query) use ($objectiveId) {
                $query->where('objective_id', $objectiveId);
            })
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $checkIns
        ]);
    }
    
    /**
     * Get check-ins for a specific key result.
     *
     * @param  int  $keyResultId
     * @return \Illuminate\Http\Response
     */
    public function getByKeyResult($keyResultId)
    {
        $checkIns = CheckIn::with(['user'])
            ->where('key_result_id', $keyResultId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $checkIns
        ]);
    }
    
    /**
     * Calculate and update progress for a key result
     *
     * @param  \App\Models\KeyResult  $keyResult
     * @return void
     */
    private function calculateAndUpdateProgress($keyResult)
    {
        $startValue = $keyResult->start_value ?? 0;
        $targetValue = $keyResult->target_value;
        $currentValue = $keyResult->current_value;
        
        // Calculate progress percentage based on format
        switch ($keyResult->format) {
            case 'boolean':
                $progress = $currentValue ? 100 : 0;
                break;
                
            case 'percentage':
            case 'number':
            case 'currency':
            default:
                // Handle cases where target is less than start (e.g., reducing costs)
                if ($targetValue < $startValue) {
                    if ($currentValue <= $targetValue) {
                        $progress = 100;
                    } elseif ($currentValue >= $startValue) {
                        $progress = 0;
                    } else {
                        $progress = 100 - (($currentValue - $targetValue) / ($startValue - $targetValue) * 100);
                    }
                } else {
                    if ($currentValue >= $targetValue) {
                        $progress = 100;
                    } elseif ($currentValue <= $startValue) {
                        $progress = 0;
                    } else {
                        $progress = (($currentValue - $startValue) / ($targetValue - $startValue)) * 100;
                    }
                }
                break;
        }
        
        // Ensure progress is between 0 and 100
        $progress = max(0, min(100, $progress));
        
        // Update progress
        $keyResult->progress = $progress;
        
        // If progress is 100%, set status to completed
        if ($progress == 100 && $keyResult->status != 'completed') {
            $keyResult->status = 'completed';
        } elseif ($progress > 0 && $keyResult->status == 'not_started') {
            $keyResult->status = 'in_progress';
        }
        
        $keyResult->save();
    }
    
    /**
     * Update the progress of an objective based on its key results
     *
     * @param  int  $objectiveId
     * @return void
     */
    private function updateObjectiveProgress($objectiveId)
    {
        // Get the objective with its key results
        $objective = \App\Models\Objective::with('keyResults')->findOrFail($objectiveId);
        
        if ($objective->keyResults->isEmpty()) {
            return;
        }
        
        // Calculate average progress
        $totalProgress = $objective->keyResults->sum('progress');
        $averageProgress = $totalProgress / $objective->keyResults->count();
        
        // Update objective progress
        $objective->progress = $averageProgress;
        
        // Update status based on key results
        $allCompleted = $objective->keyResults->every(function ($kr) {
            return $kr->status === 'completed';
        });
        
        $anyAtRisk = $objective->keyResults->contains(function ($kr) {
            return $kr->status === 'at_risk';
        });
        
        if ($allCompleted) {
            $objective->status = 'completed';
        } elseif ($anyAtRisk) {
            $objective->status = 'at_risk';
        } elseif ($averageProgress > 0) {
            $objective->status = 'in_progress';
        }
        
        $objective->save();
    }
}