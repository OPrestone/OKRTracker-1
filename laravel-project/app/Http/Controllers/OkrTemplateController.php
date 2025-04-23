<?php

namespace App\Http\Controllers;

use App\Models\OkrTemplate;
use App\Services\AiTemplateGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class OkrTemplateController extends Controller
{
    protected $aiTemplateGenerator;

    public function __construct(AiTemplateGenerator $aiTemplateGenerator)
    {
        $this->aiTemplateGenerator = $aiTemplateGenerator;
    }

    /**
     * Display a listing of templates.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = OkrTemplate::query();
        
        // Filter by category if provided
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }
        
        // Filter by department if provided
        if ($request->has('department') && $request->department) {
            $query->where('department', $request->department);
        }
        
        // Filter by search term if provided
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $templates = $query->orderBy('created_at', 'desc')->paginate(12);
        
        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
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
            'description' => 'required|string',
            'category' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'template_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = OkrTemplate::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating template', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified template.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $template = OkrTemplate::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $template
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
                'error' => $e->getMessage()
            ], 404);
        }
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
        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'string',
            'category' => 'string|max:100',
            'department' => 'string|max:100',
            'template_data' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $template = OkrTemplate::findOrFail($id);
            $template->update($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully',
                'data' => $template
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating template', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified template.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $template = OkrTemplate::findOrFail($id);
            $template->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Generate a template using AI based on the provided description.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function generateWithAi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'required|string|min:10',
            'department' => 'required|string|max:100',
            'level' => 'required|string|in:company,department,team,individual',
            'save' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $templateData = $this->aiTemplateGenerator->generateTemplate(
                $request->description,
                $request->department,
                $request->level
            );
            
            // Save the template if requested
            if ($request->save === true) {
                $template = OkrTemplate::create([
                    'name' => $templateData['name'],
                    'description' => $templateData['description'],
                    'category' => $templateData['category'] ?? 'AI Generated',
                    'department' => $templateData['department'] ?? $request->department,
                    'template_data' => $templateData['template_data'],
                    'is_ai_generated' => true
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'AI template generated and saved successfully',
                    'data' => $template
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'AI template generated successfully',
                'data' => $templateData
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating AI template', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate AI template',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get unique categories from existing templates.
     *
     * @return \Illuminate\Http\Response
     */
    public function getCategories()
    {
        $categories = OkrTemplate::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');
        
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
    
    /**
     * Get unique departments from existing templates.
     *
     * @return \Illuminate\Http\Response
     */
    public function getDepartments()
    {
        $departments = OkrTemplate::select('department')
            ->distinct()
            ->orderBy('department')
            ->pluck('department');
        
        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }
}