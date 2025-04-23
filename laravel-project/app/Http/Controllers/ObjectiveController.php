<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\Team;
use App\Models\Timeframe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ObjectiveController extends Controller
{
    /**
     * Display a listing of objectives.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Objective::with(['owner', 'team', 'timeframe', 'keyResults']);
        
        // Filter by owner if provided
        if ($request->has('owner_id') && $request->owner_id) {
            $query->where('owner_id', $request->owner_id);
        }
        
        // Filter by team if provided
        if ($request->has('team_id') && $request->team_id) {
            $query->where('team_id', $request->team_id);
        }
        
        // Filter by timeframe if provided
        if ($request->has('timeframe_id') && $request->timeframe_id) {
            $query->where('timeframe_id', $request->timeframe_id);
        }
        
        // Filter by status if provided
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        // Filter by search term if provided
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $objectives = $query->orderBy('created_at', 'desc')->paginate(10);
        
        return response()->json([
            'success' => true,
            'data' => $objectives
        ]);
    }

    /**
     * Store a newly created objective.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'owner_id' => 'required|exists:users,id',
            'team_id' => 'required|exists:teams,id',
            'timeframe_id' => 'required|exists:timeframes,id',
            'status' => 'required|in:not_started,in_progress,at_risk,completed,canceled',
            'level' => 'required|in:company,department,team,individual',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $objective = Objective::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Objective created successfully',
                'data' => $objective->load(['owner', 'team', 'timeframe'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating objective', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create objective',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified objective.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $objective = Objective::with([
                'owner', 
                'team', 
                'timeframe', 
                'keyResults.checkIns', 
                'keyResults.initiatives'
            ])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $objective
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Objective not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified objective.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'owner_id' => 'exists:users,id',
            'team_id' => 'exists:teams,id',
            'timeframe_id' => 'exists:timeframes,id',
            'status' => 'in:not_started,in_progress,at_risk,completed,canceled',
            'level' => 'in:company,department,team,individual',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $objective = Objective::findOrFail($id);
            $objective->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Objective updated successfully',
                'data' => $objective->load(['owner', 'team', 'timeframe'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating objective', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update objective',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified objective.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $objective = Objective::findOrFail($id);
            $objective->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Objective deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete objective',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Update objective progress.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateProgress(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'progress' => 'required|numeric|min:0|max:100',
            'status' => 'required|in:not_started,in_progress,at_risk,completed,canceled',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $objective = Objective::findOrFail($id);
            
            // Update progress and status
            $objective->progress = $request->progress;
            $objective->status = $request->status;
            $objective->save();
            
            // If progress is 100%, set status to completed
            if ($request->progress == 100 && $request->status != 'completed') {
                $objective->status = 'completed';
                $objective->save();
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Objective progress updated successfully',
                'data' => $objective
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating objective progress', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update objective progress',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Get the objectives for the current user.
     *
     * @return \Illuminate\Http\Response
     */
    public function myObjectives()
    {
        $userId = Auth::id();
        
        $objectives = Objective::with(['team', 'timeframe', 'keyResults'])
            ->where('owner_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $objectives
        ]);
    }
    
    /**
     * Get the objectives for the user's team.
     *
     * @return \Illuminate\Http\Response
     */
    public function teamObjectives()
    {
        $userId = Auth::id();
        $teamIds = User::findOrFail($userId)->teams()->pluck('teams.id');
        
        $objectives = Objective::with(['owner', 'team', 'timeframe', 'keyResults'])
            ->whereIn('team_id', $teamIds)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $objectives
        ]);
    }
}