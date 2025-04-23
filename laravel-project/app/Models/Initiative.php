<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Initiative extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'key_result_id',
        'assigned_to_id',
        'status',
        'completed',
        'completed_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the key result that owns the initiative.
     */
    public function keyResult(): BelongsTo
    {
        return $this->belongsTo(KeyResult::class);
    }

    /**
     * Get the user assigned to the initiative.
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    /**
     * Mark the initiative as complete.
     *
     * @return void
     */
    public function markComplete(): void
    {
        $this->completed = true;
        $this->completed_at = now();
        $this->status = 'completed';
        $this->save();
        
        // Check if this should update the key result progress
        $this->updateKeyResultProgress();
    }

    /**
     * Mark the initiative as incomplete.
     *
     * @return void
     */
    public function markIncomplete(): void
    {
        $this->completed = false;
        $this->completed_at = null;
        $this->status = 'in_progress';
        $this->save();
        
        // Check if this should update the key result progress
        $this->updateKeyResultProgress();
    }

    /**
     * Update the key result progress based on completed initiatives.
     *
     * @return void
     */
    private function updateKeyResultProgress(): void
    {
        $keyResult = $this->keyResult;
        
        if (!$keyResult) {
            return;
        }
        
        // If the key result has numeric values, don't update based on initiatives
        if ($keyResult->target_value !== null && $keyResult->current_value !== null) {
            return;
        }
        
        // Count total and completed initiatives for this key result
        $totalInitiatives = $keyResult->initiatives()->count();
        $completedInitiatives = $keyResult->initiatives()->where('completed', true)->count();
        
        if ($totalInitiatives > 0) {
            $progress = round(($completedInitiatives / $totalInitiatives) * 100);
            $keyResult->updateProgress($progress);
        }
    }

    /**
     * Scope a query to only include completed initiatives.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCompleted($query)
    {
        return $query->where('completed', true);
    }

    /**
     * Scope a query to only include incomplete initiatives.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeIncomplete($query)
    {
        return $query->where('completed', false);
    }
}