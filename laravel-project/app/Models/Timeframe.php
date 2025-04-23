<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timeframe extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'cadence_id',
        'status',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Get the cadence that owns the timeframe.
     */
    public function cadence(): BelongsTo
    {
        return $this->belongsTo(Cadence::class);
    }

    /**
     * Get the objectives for the timeframe.
     */
    public function objectives(): HasMany
    {
        return $this->hasMany(Objective::class);
    }

    /**
     * Check if the timeframe is active.
     */
    public function isActive(): bool
    {
        $now = now();
        return $this->start_date <= $now && $this->end_date >= $now;
    }

    /**
     * Check if the timeframe is in the future.
     */
    public function isFuture(): bool
    {
        return $this->start_date > now();
    }

    /**
     * Check if the timeframe is in the past.
     */
    public function isPast(): bool
    {
        return $this->end_date < now();
    }

    /**
     * Get the progress statistics for the timeframe.
     */
    public function getProgressStats(): array
    {
        $objectives = $this->objectives;
        
        if ($objectives->isEmpty()) {
            return [
                'total' => 0,
                'completed' => 0,
                'in_progress' => 0,
                'not_started' => 0,
                'average_progress' => 0,
            ];
        }
        
        $total = $objectives->count();
        $completed = $objectives->where('progress', 100)->count();
        $notStarted = $objectives->where('progress', 0)->count();
        $inProgress = $total - $completed - $notStarted;
        $averageProgress = $objectives->avg('progress');
        
        return [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'not_started' => $notStarted,
            'average_progress' => $averageProgress,
        ];
    }
}