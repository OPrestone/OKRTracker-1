<?php

namespace App\Http\Controllers;

use App\Models\Objective;
use App\Models\Team;
use App\Models\Timeframe;
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
     * Display a listing of the objectives.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Objective::with(['user', 'team', 'timeframe', 'keyResults']);
        
        // Filter by team if specified
        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }
        
        // Filter by user if specified
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filter by timeframe if specified
        if ($request->has('timeframe_id')) {
            $query->where('timeframe_id', $request->timeframe_id);
        }
        
        // Filter by status if specified
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $objectives = $query->orderBy('created_at', 'desc')->paginate(15);
        
        return response()->json($objectives);
    }

    /**
     * Store a newly created objective in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'team_id' => 'nullable|exists:teams,id',
            'timeframe_id' => 'required|exists:timeframes,id',
            'status' => 'nullable|in:draft,active,completed,archived',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|integer|min:0|max:10',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $objective = new Objective($request->all());
        $objective->user_id = Auth::id();
        $objective->progress = 0; // Initial progress is 0
        $objective->save();
        
        return response()->json($objective->load(['user', 'team', 'timeframe']), 201);
    }

    /**
     * Display the specified objective.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $objective = Objective::with(['user', 'team', 'timeframe', 'keyResults', 'checkIns'])
            ->findOrFail($id);
        
        return response()->json($objective);
    }

    /**
     * Update the specified objective in storage.
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
            'team_id' => 'nullable|exists:teams,id',
            'timeframe_id' => 'sometimes|required|exists:timeframes,id',
            'status' => 'nullable|in:draft,active,completed,archived',
            'progress' => 'nullable|numeric|min:0|max:100',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|integer|min:0|max:10',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $objective->update($request->all());
        
        return response()->json($objective->fresh(['user', 'team', 'timeframe']));
    }

    /**
     * Update the progress of the specified objective.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateProgress(Request $request, $id)
    {
        $objective = Objective::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'progress' => 'required|numeric|min:0|max:100',
            'note' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Record a check-in
        $checkIn = $objective->checkIns()->create([
            'user_id' => Auth::id(),
            'previous_value' => $objective->progress,
            'new_value' => $request->progress,
            'progress_change' => $request->progress - $objective->progress,
            'note' => $request->note,
            'status' => $request->status ?? 'on_track',
        ]);
        
        // Update the objective progress
        $objective->progress = $request->progress;
        
        // If progress is 100%, mark as completed
        if ($objective->progress >= 100) {
            $objective->status = 'completed';
        }
        
        $objective->save();
        
        return response()->json([
            'objective' => $objective->fresh(['user', 'team', 'timeframe']),
            'check_in' => $checkIn,
        ]);
    }

    /**
     * Remove the specified objective from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $objective = Objective::findOrFail($id);
        $objective->delete();
        
        return response()->json(null, 204);
    }
}