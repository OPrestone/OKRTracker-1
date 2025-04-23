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
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'key_result_id',
        'user_id',
        'status',
        'start_date',
        'due_date',
        'completed_at',
        'priority',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'completed_at' => 'datetime',
        'priority' => 'integer',
    ];

    /**
     * Get the key result that owns the initiative.
     */
    public function keyResult(): BelongsTo
    {
        return $this->belongsTo(KeyResult::class);
    }

    /**
     * Get the user that owns the initiative.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark the initiative as complete.
     */
    public function complete(): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
    }

    /**
     * Check if the initiative is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status !== 'completed' 
            && $this->due_date 
            && $this->due_date->isPast();
    }

    /**
     * Get the estimated completion percentage.
     */
    public function getCompletionPercentage(): int
    {
        if ($this->status === 'completed') {
            return 100;
        }
        
        if ($this->status === 'not_started') {
            return 0;
        }
        
        // For in-progress initiatives, calculate based on dates
        if ($this->start_date && $this->due_date) {
            $totalDuration = $this->start_date->diffInDays($this->due_date);
            
            if ($totalDuration === 0) {
                return 50; // Same day task
            }
            
            $elapsedDuration = $this->start_date->diffInDays(now());
            $percentage = min(95, max(5, ($elapsedDuration / $totalDuration) * 100));
            
            return intval($percentage);
        }
        
        return 50; // Default for in-progress with no dates
    }
}