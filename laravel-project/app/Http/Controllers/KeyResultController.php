<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class KeyResultController extends Controller
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
     * Display a listing of the key results.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = KeyResult::with(['user', 'objective', 'objective.team', 'objective.timeframe']);
        
        // Filter by objective if specified
        if ($request->has('objective_id')) {
            $query->where('objective_id', $request->objective_id);
        }
        
        // Filter by user if specified
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        // Filter by status if specified
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $keyResults = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json($keyResults);
    }

    /**
     * Store a newly created key result in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'objective_id' => 'required|exists:objectives,id',
            'type' => 'nullable|in:numeric,percentage,binary,currency',
            'target_value' => 'nullable|numeric',
            'start_value' => 'nullable|numeric',
            'current_value' => 'nullable|numeric',
            'format' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:not_started,in_progress,at_risk,completed',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $keyResult = new KeyResult($request->all());
        $keyResult->user_id = Auth::id();
        $keyResult->progress = 0; // Initial progress is 0
        
        // If current_value is not provided, use start_value
        if (is_null($keyResult->current_value) && !is_null($keyResult->start_value)) {
            $keyResult->current_value = $keyResult->start_value;
        }
        
        $keyResult->save();
        
        // Calculate progress
        $keyResult->calculateProgress();
        
        return response()->json(
            $keyResult->load(['user', 'objective', 'objective.team', 'objective.timeframe']), 
            201
        );
    }

    /**
     * Display the specified key result.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $keyResult = KeyResult::with([
            'user', 
            'objective', 
            'objective.team', 
            'objective.timeframe', 
            'initiatives',
            'checkIns'
        ])->findOrFail($id);
        
        return response()->json($keyResult);
    }

    /**
     * Update the specified key result in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $keyResult = KeyResult::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|in:numeric,percentage,binary,currency',
            'target_value' => 'nullable|numeric',
            'start_value' => 'nullable|numeric',
            'format' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:not_started,in_progress,at_risk,completed',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $keyResult->update($request->except('current_value', 'progress'));
        
        return response()->json(
            $keyResult->fresh(['user', 'objective', 'objective.team', 'objective.timeframe'])
        );
    }

    /**
     * Update the progress of the specified key result.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateProgress(Request $request, $id)
    {
        $keyResult = KeyResult::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'current_value' => 'required|numeric',
            'note' => 'nullable|string',
            'confidence' => 'nullable|integer|min:1|max:10',
            'mood' => 'nullable|in:very_positive,positive,neutral,negative,very_negative',
            'status' => 'nullable|in:on_track,at_risk,off_track',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Record a check-in
        $checkIn = $keyResult->checkIns()->create([
            'user_id' => Auth::id(),
            'objective_id' => $keyResult->objective_id,
            'previous_value' => $keyResult->current_value,
            'new_value' => $request->current_value,
            'note' => $request->note,
            'confidence' => $request->confidence,
            'mood' => $request->mood,
            'status' => $request->status,
        ]);
        
        // Update the key result current value
        $keyResult->current_value = $request->current_value;
        $keyResult->save();
        
        // Calculate progress
        $keyResult->calculateProgress();
        
        // If progress is 100%, mark as completed
        if ($keyResult->progress >= 100) {
            $keyResult->status = 'completed';
            $keyResult->save();
        }
        
        // Recalculate parent objective progress
        $keyResult->objective->calculateProgress();
        
        return response()->json([
            'key_result' => $keyResult->fresh(['user', 'objective']),
            'check_in' => $checkIn,
            'objective' => $keyResult->objective->fresh(),
        ]);
    }

    /**
     * Remove the specified key result from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $keyResult = KeyResult::findOrFail($id);
        $objective = $keyResult->objective;
        $keyResult->delete();
        
        // Recalculate parent objective progress
        $objective->calculateProgress();
        
        return response()->json(null, 204);
    }
}