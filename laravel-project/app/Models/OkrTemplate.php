<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OkrTemplate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'description',
        'category',
        'department',
        'created_by',
        'is_system',
        'template_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_system' => 'boolean',
        'template_data' => 'array',
    ];

    /**
     * Get the user who created the template.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope a query to only include system templates.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope a query to only include user-created templates.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUserCreated($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope a query to only include templates for a specific category.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $category
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to only include templates for a specific department.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $department
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Generate an Objective from this template.
     *
     * @param array $params Additional parameters for the objective
     * @return array The objective data to be created
     */
    public function generateObjective(array $params = []): array
    {
        $template = $this->template_data;
        
        if (!isset($template['objective'])) {
            throw new \Exception('Invalid template format: missing objective data');
        }
        
        $objective = $template['objective'];
        
        // Merge with provided parameters
        $objective = array_merge($objective, $params);
        
        return $objective;
    }

    /**
     * Generate Key Results from this template.
     *
     * @return array The key results data to be created
     */
    public function generateKeyResults(): array
    {
        $template = $this->template_data;
        
        if (!isset($template['key_results']) || !is_array($template['key_results'])) {
            return [];
        }
        
        return $template['key_results'];
    }

    /**
     * Generate Initiatives from this template.
     *
     * @return array The initiatives data to be created
     */
    public function generateInitiatives(): array
    {
        $template = $this->template_data;
        
        if (!isset($template['initiatives']) || !is_array($template['initiatives'])) {
            return [];
        }
        
        return $template['initiatives'];
    }

    /**
     * Create a complete OKR set (objective, key results, initiatives) from this template.
     *
     * @param int $ownerId The ID of the user who will own the objective
     * @param int $timeframeId The ID of the timeframe
     * @param int|null $teamId The ID of the team (optional)
     * @return Objective The created objective with relationships
     */
    public function createOkrSet(int $ownerId, int $timeframeId, ?int $teamId = null): Objective
    {
        // Generate the objective
        $objectiveData = $this->generateObjective([
            'owner_id' => $ownerId,
            'timeframe_id' => $timeframeId,
            'team_id' => $teamId,
        ]);
        
        // Create the objective
        $objective = Objective::create($objectiveData);
        
        // Generate and create key results
        $keyResultsData = $this->generateKeyResults();
        $keyResults = [];
        
        foreach ($keyResultsData as $krData) {
            $krData['objective_id'] = $objective->id;
            $krData['assigned_to_id'] = $krData['assigned_to_id'] ?? $ownerId;
            
            $keyResult = KeyResult::create($krData);
            $keyResults[] = $keyResult;
            
            // Generate and create initiatives for this key result
            if (isset($krData['initiatives']) && is_array($krData['initiatives'])) {
                foreach ($krData['initiatives'] as $initiativeData) {
                    $initiativeData['key_result_id'] = $keyResult->id;
                    $initiativeData['assigned_to_id'] = $initiativeData['assigned_to_id'] ?? $krData['assigned_to_id'] ?? $ownerId;
                    
                    Initiative::create($initiativeData);
                }
            }
        }
        
        // Generate and create global initiatives (not tied to specific key results)
        $initiativesData = $this->generateInitiatives();
        
        if (!empty($keyResults) && !empty($initiativesData)) {
            $firstKeyResult = $keyResults[0];
            
            foreach ($initiativesData as $initiativeData) {
                $initiativeData['key_result_id'] = $firstKeyResult->id;
                $initiativeData['assigned_to_id'] = $initiativeData['assigned_to_id'] ?? $ownerId;
                
                Initiative::create($initiativeData);
            }
        }
        
        return $objective->fresh(['keyResults.initiatives']);
    }
}