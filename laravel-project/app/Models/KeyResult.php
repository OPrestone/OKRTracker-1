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
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'objective_id',
        'assigned_to_id',
        'target_value',
        'current_value',
        'start_value',
        'progress',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'progress' => 'integer',
    ];

    /**
     * Get the objective that owns the key result.
     */
    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }

    /**
     * Get the user assigned to the key result.
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    /**
     * Get the initiatives for this key result.
     */
    public function initiatives(): HasMany
    {
        return $this->hasMany(Initiative::class);
    }

    /**
     * Get the check-ins for this key result.
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * Calculate the progress of this key result.
     * This method is for key results with numerical target values.
     *
     * @return int
     */
    public function calculateProgress(): int
    {
        if ($this->current_value === null || $this->target_value === null || $this->start_value === null) {
            return $this->progress;
        }
        
        // Convert to numerical values if needed
        $start = floatval($this->start_value);
        $current = floatval($this->current_value);
        $target = floatval($this->target_value);
        
        // Ensure the target is different from the start
        if ($target == $start) {
            return $current >= $target ? 100 : 0;
        }
        
        // Handle ascending or descending targets (where lower is better)
        $isAscending = $target > $start;
        
        if ($isAscending) {
            // For ascending targets (higher is better)
            if ($current >= $target) {
                $progress = 100;
            } elseif ($current <= $start) {
                $progress = 0;
            } else {
                $progress = round(($current - $start) / ($target - $start) * 100);
            }
        } else {
            // For descending targets (lower is better)
            if ($current <= $target) {
                $progress = 100;
            } elseif ($current >= $start) {
                $progress = 0;
            } else {
                $progress = round(($start - $current) / ($start - $target) * 100);
            }
        }
        
        // Ensure progress is between 0 and 100
        $progress = max(0, min(100, $progress));
        
        $this->progress = $progress;
        $this->updateStatus();
        $this->save();
        
        // If the objective exists, recalculate its progress
        if ($this->objective) {
            $this->objective->calculateProgress();
        }
        
        return $progress;
    }

    /**
     * Update the status based on the progress.
     *
     * @return void
     */
    public function updateStatus(): void
    {
        if ($this->progress >= 100) {
            $this->status = 'completed';
        } elseif ($this->progress >= 70) {
            $this->status = 'on_track';
        } elseif ($this->progress >= 30) {
            $this->status = 'at_risk';
        } elseif ($this->progress > 0) {
            $this->status = 'behind';
        } else {
            $this->status = 'not_started';
        }
    }

    /**
     * Check if this key result is completed.
     *
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed' || $this->progress >= 100;
    }

    /**
     * Update the progress based on a set value.
     *
     * @param int $progress
     * @return void
     */
    public function updateProgress(int $progress): void
    {
        $this->progress = max(0, min(100, $progress));
        $this->updateStatus();
        $this->save();
        
        // If the objective exists, recalculate its progress
        if ($this->objective) {
            $this->objective->calculateProgress();
        }
    }
}