<?php

namespace App\Http\Controllers;

use App\Models\OkrTemplate;
use App\Models\Objective;
use App\Models\Team;
use App\Models\Timeframe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class OkrTemplateController extends Controller
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
     * Display a listing of templates.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = OkrTemplate::with('creator');
        
        // Filter by category
        if ($request->has('category')) {
            $query->byCategory($request->category);
        }
        
        // Filter by department
        if ($request->has('department')) {
            $query->byDepartment($request->department);
        }
        
        // Filter by type (system or user-created)
        if ($request->has('type')) {
            if ($request->type === 'system') {
                $query->system();
            } elseif ($request->type === 'user') {
                $query->userCreated();
            }
        }
        
        // Filter by creator
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }
        
        // Sort by name by default
        $templates = $query->orderBy('name')->get();
        
        return response()->json($templates);
    }

    /**
     * Store a newly created template.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'template_data' => 'required|array',
            'template_data.objective' => 'required|array',
            'template_data.objective.title' => 'required|string|max:255',
            'template_data.objective.level' => 'required|string|in:company,department,team,individual',
            'template_data.key_results' => 'required|array',
            'template_data.key_results.*.title' => 'required|string|max:255',
            'template_data.initiatives' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Set created_by to current user
        $request->merge(['created_by' => Auth::id()]);
        
        // Set is_system to false for user-created templates
        $request->merge(['is_system' => false]);
        
        $template = OkrTemplate::create($request->all());
        
        return response()->json($template->load('creator'), 201);
    }

    /**
     * Display the specified template.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $template = OkrTemplate::with('creator')->findOrFail($id);
        
        return response()->json($template);
    }

    /**
     * Update the specified template.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $template = OkrTemplate::findOrFail($id);
        
        // Only allow users to edit their own templates unless they're admins
        if (!$template->is_system && $template->created_by !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json([
                'errors' => ['unauthorized' => ['You do not have permission to edit this template.']]
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'template_data' => 'sometimes|required|array',
            'template_data.objective' => 'sometimes|required|array',
            'template_data.objective.title' => 'sometimes|required|string|max:255',
            'template_data.key_results' => 'sometimes|required|array',
            'template_data.key_results.*.title' => 'sometimes|required|string|max:255',
            'template_data.initiatives' => 'nullable|array',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Don't allow changing is_system by regular users
        if (Auth::user()->role !== 'admin') {
            $request->request->remove('is_system');
        }
        
        $template->update($request->all());
        
        return response()->json($template->fresh(['creator']));
    }

    /**
     * Remove the specified template.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $template = OkrTemplate::findOrFail($id);
        
        // Only allow users to delete their own templates unless they're admins
        if (!$template->is_system && $template->created_by !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json([
                'errors' => ['unauthorized' => ['You do not have permission to delete this template.']]
            ], 403);
        }
        
        // System templates can only be deleted by admins
        if ($template->is_system && Auth::user()->role !== 'admin') {
            return response()->json([
                'errors' => ['unauthorized' => ['You do not have permission to delete system templates.']]
            ], 403);
        }
        
        $template->delete();
        
        return response()->json(null, 204);
    }

    /**
     * Generate OKRs from a template.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function generate(Request $request, $id)
    {
        $template = OkrTemplate::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'timeframe_id' => 'required|exists:timeframes,id',
            'team_id' => 'nullable|exists:teams,id',
            'owner_id' => 'nullable|exists:users,id',
            'parent_id' => 'nullable|exists:objectives,id',
            'custom_title' => 'nullable|string|max:255',
            'custom_description' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Set owner to current user if not provided
        $ownerId = $request->owner_id ?? Auth::id();
        
        // Check if timeframe exists and is active
        $timeframe = Timeframe::findOrFail($request->timeframe_id);
        
        // Handle team association if provided
        $teamId = null;
        if ($request->has('team_id')) {
            $team = Team::findOrFail($request->team_id);
            $teamId = $team->id;
        }
        
        try {
            // Create the OKR set from the template
            $objective = $template->createOkrSet($ownerId, $timeframe->id, $teamId);
            
            // Apply custom title/description if provided
            if ($request->has('custom_title')) {
                $objective->title = $request->custom_title;
                $objective->save();
            }
            
            if ($request->has('custom_description')) {
                $objective->description = $request->custom_description;
                $objective->save();
            }
            
            // Set parent objective if provided
            if ($request->has('parent_id')) {
                $objective->parent_id = $request->parent_id;
                $objective->save();
            }
            
            // Reload with relationships
            $objective->load([
                'owner', 
                'team', 
                'timeframe', 
                'parent',
                'keyResults.assignedTo',
                'keyResults.initiatives.assignedTo'
            ]);
            
            return response()->json([
                'message' => 'OKR set created successfully from template',
                'objective' => $objective
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['template' => [$e->getMessage()]]
            ], 422);
        }
    }

    /**
     * Clone an existing OKR set into a template.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function cloneFromObjective(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'objective_id' => 'required|exists:objectives,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Get the objective with key results and initiatives
        $objective = Objective::with(['keyResults.initiatives'])->findOrFail($request->objective_id);
        
        // Build template data
        $templateData = [
            'objective' => [
                'title' => $objective->title,
                'description' => $objective->description,
                'level' => $objective->level,
                'status' => 'not_started',
                'progress' => 0
            ],
            'key_results' => []
        ];
        
        // Add key results
        foreach ($objective->keyResults as $keyResult) {
            $krData = [
                'title' => $keyResult->title,
                'description' => $keyResult->description,
                'status' => 'not_started',
                'progress' => 0
            ];
            
            // Add initiatives for this key result
            if ($keyResult->initiatives->isNotEmpty()) {
                $krData['initiatives'] = [];
                
                foreach ($keyResult->initiatives as $initiative) {
                    $krData['initiatives'][] = [
                        'title' => $initiative->title,
                        'description' => $initiative->description,
                        'status' => 'not_started',
                        'completed' => false
                    ];
                }
            }
            
            $templateData['key_results'][] = $krData;
        }
        
        // Create the template
        $template = OkrTemplate::create([
            'name' => $request->name,
            'description' => $request->description,
            'category' => $request->category,
            'department' => $request->department,
            'created_by' => Auth::id(),
            'is_system' => false,
            'template_data' => $templateData
        ]);
        
        return response()->json($template->load('creator'), 201);
    }
}