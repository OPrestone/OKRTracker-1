<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\KeyResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ObjectiveController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of objectives.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Objective::with(['owner', 'team', 'timeframe', 'keyResults']);
        
        // Filter by owner
        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }
        
        // Filter by team
        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }
        
        // Filter by timeframe
        if ($request->has('timeframe_id')) {
            $query->where('timeframe_id', $request->timeframe_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by level
        if ($request->has('level')) {
            $query->where('level', $request->level);
        }
        
        // Filter by parent objective
        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        }
        
        // Include only top-level objectives
        if ($request->has('top_level') && $request->top_level) {
            $query->whereNull('parent_id');
        }
        
        // Order by created date (newest first by default)
        $query->orderBy('created_at', $request->order ?? 'desc');
        
        $objectives = $query->get();
        
        return response()->json($objectives);
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
            'level' => 'required|string|in:company,department,team,individual',
            'team_id' => 'nullable|exists:teams,id',
            'timeframe_id' => 'required|exists:timeframes,id',
            'parent_id' => 'nullable|exists:objectives,id',
            'status' => 'nullable|string|in:not_started,on_track,at_risk,behind,completed',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Set owner to current authenticated user if not provided
        if (!$request->has('owner_id')) {
            $request->merge(['owner_id' => Auth::id()]);
        }
        
        $objective = Objective::create($request->all());
        
        // Create key results if provided
        if ($request->has('key_results') && is_array($request->key_results)) {
            foreach ($request->key_results as $krData) {
                $krData['objective_id'] = $objective->id;
                KeyResult::create($krData);
            }
            
            // Reload objective with key results
            $objective->load('keyResults');
        }
        
        return response()->json($objective->load(['owner', 'team', 'timeframe', 'parent']), 201);
    }

    /**
     * Display the specified objective.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $objective = Objective::with([
            'owner', 
            'team', 
            'timeframe', 
            'parent',
            'children',
            'keyResults.assignedTo',
            'keyResults.initiatives',
            'checkIns.user'
        ])->findOrFail($id);
        
        return response()->json($objective);
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
        $objective = Objective::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'sometimes|required|string|in:company,department,team,individual',
            'owner_id' => 'sometimes|required|exists:users,id',
            'team_id' => 'nullable|exists:teams,id',
            'timeframe_id' => 'sometimes|required|exists:timeframes,id',
            'parent_id' => 'nullable|exists:objectives,id',
            'status' => 'nullable|string|in:not_started,on_track,at_risk,behind,completed',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Prevent circular reference
        if ($request->has('parent_id') && $request->parent_id == $id) {
            return response()->json([
                'errors' => ['parent_id' => ['An objective cannot be its own parent.']]
            ], 422);
        }
        
        $objective->update($request->all());
        
        return response()->json($objective->fresh(['owner', 'team', 'timeframe', 'parent', 'keyResults']));
    }

    /**
     * Remove the specified objective.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $objective = Objective::findOrFail($id);
        
        // Check if the objective has children
        if ($objective->children()->exists()) {
            return response()->json([
                'errors' => ['objective' => ['Cannot delete an objective that has child objectives.']]
            ], 422);
        }
        
        $objective->delete();
        
        return response()->json(null, 204);
    }

    /**
     * Update the progress of an objective.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateProgress(Request $request, $id)
    {
        $objective = Objective::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'progress' => 'required|integer|min:0|max:100',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $objective->progress = $request->progress;
        $objective->updateStatus();
        $objective->save();
        
        // Create a check-in record if notes are provided
        if ($request->has('notes')) {
            $objective->checkIns()->create([
                'user_id' => Auth::id(),
                'progress' => $request->progress,
                'notes' => $request->notes,
            ]);
        }
        
        return response()->json($objective->fresh());
    }
}