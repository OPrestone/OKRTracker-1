<?php

namespace App\Http\Controllers;

use App\Models\Timeframe;
use App\Models\Cadence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TimeframeController extends Controller
{
    /**
     * Display a listing of timeframes.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Timeframe::with(['cadence']);
        
        // Filter by cadence if provided
        if ($request->has('cadence_id') && $request->cadence_id) {
            $query->where('cadence_id', $request->cadence_id);
        }
        
        // Filter by active if provided
        if ($request->has('active') && $request->active) {
            $now = Carbon::now();
            $query->where('start_date', '<=', $now)
                  ->where('end_date', '>=', $now);
        }
        
        // Filter by year if provided
        if ($request->has('year') && $request->year) {
            $year = $request->year;
            $query->where(function($q) use ($year) {
                $q->whereYear('start_date', $year)
                  ->orWhereYear('end_date', $year);
            });
        }
        
        // Filter by search term if provided
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }
        
        $timeframes = $query->orderBy('start_date', 'desc')->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => $timeframes
        ]);
    }

    /**
     * Store a newly created timeframe.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'cadence_id' => 'required|exists:cadences,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $timeframe = Timeframe::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Timeframe created successfully',
                'data' => $timeframe->load(['cadence'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating timeframe', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create timeframe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified timeframe.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $timeframe = Timeframe::with(['cadence', 'objectives' => function($query) {
                $query->with(['keyResults', 'owner', 'team']);
            }])->findOrFail($id);
            
            // Calculate days remaining
            $now = Carbon::now();
            $endDate = Carbon::parse($timeframe->end_date);
            $daysRemaining = max(0, $now->diffInDays($endDate, false));
            
            $timeframe->days_remaining = $daysRemaining;
            
            // Calculate progress percentage
            $startDate = Carbon::parse($timeframe->start_date);
            $totalDays = $startDate->diffInDays($endDate);
            $elapsedDays = $startDate->diffInDays($now);
            $progressPercentage = $totalDays > 0 ? min(100, max(0, ($elapsedDays / $totalDays) * 100)) : 0;
            
            $timeframe->progress_percentage = $progressPercentage;
            
            return response()->json([
                'success' => true,
                'data' => $timeframe
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Timeframe not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified timeframe.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'cadence_id' => 'exists:cadences,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $timeframe = Timeframe::findOrFail($id);
            $timeframe->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Timeframe updated successfully',
                'data' => $timeframe->load(['cadence'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating timeframe', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update timeframe',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified timeframe.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $timeframe = Timeframe::findOrFail($id);
            
            // Check if timeframe has objectives
            if ($timeframe->objectives()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete timeframe with associated objectives'
                ], 422);
            }
            
            $timeframe->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Timeframe deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete timeframe',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Get active timeframes.
     *
     * @return \Illuminate\Http\Response
     */
    public function getActive()
    {
        $now = Carbon::now();
        
        $timeframes = Timeframe::with(['cadence'])
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->orderBy('end_date')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $timeframes
        ]);
    }
    
    /**
     * Get upcoming timeframes.
     *
     * @return \Illuminate\Http\Response
     */
    public function getUpcoming()
    {
        $now = Carbon::now();
        
        $timeframes = Timeframe::with(['cadence'])
            ->where('start_date', '>', $now)
            ->orderBy('start_date')
            ->limit(5)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $timeframes
        ]);
    }
    
    /**
     * Get current year's timeframes.
     *
     * @return \Illuminate\Http\Response
     */
    public function getCurrentYear()
    {
        $year = Carbon::now()->year;
        
        $timeframes = Timeframe::with(['cadence'])
            ->where(function($query) use ($year) {
                $query->whereYear('start_date', $year)
                      ->orWhereYear('end_date', $year);
            })
            ->orderBy('start_date')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $timeframes
        ]);
    }
}