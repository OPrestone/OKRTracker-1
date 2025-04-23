<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KeyResult extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'objective_id',
        'user_id',
        'type',
        'target_value',
        'current_value',
        'start_value',
        'format',
        'progress',
        'due_date',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'target_value' => 'float',
        'current_value' => 'float',
        'start_value' => 'float',
        'progress' => 'float',
        'due_date' => 'date',
    ];

    /**
     * Get the objective that owns the key result.
     */
    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }

    /**
     * Get the user that owns the key result.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the initiatives for the key result.
     */
    public function initiatives(): HasMany
    {
        return $this->hasMany(Initiative::class);
    }

    /**
     * Get the check-ins for the key result.
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * Calculate progress based on current value compared to target.
     */
    public function calculateProgress(): void
    {
        // If no target value is set, progress remains 0
        if ($this->target_value === null || $this->target_value == $this->start_value) {
            $this->progress = 0;
            $this->save();
            return;
        }

        $totalRange = abs($this->target_value - $this->start_value);
        $currentProgress = abs($this->current_value - $this->start_value);
        
        // Calculate percentage progress (0-100%)
        $progress = min(100, max(0, ($currentProgress / $totalRange) * 100));
        
        $this->progress = $progress;
        $this->save();
        
        // Update parent objective progress
        $this->objective->calculateProgress();
    }
}