<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Objective extends Model
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
        'team_id',
        'user_id',
        'timeframe_id',
        'status',
        'progress',
        'due_date',
        'priority',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'progress' => 'float',
        'due_date' => 'date',
        'priority' => 'integer',
    ];

    /**
     * Get the user that owns the objective.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the team that owns the objective.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the timeframe that owns the objective.
     */
    public function timeframe(): BelongsTo
    {
        return $this->belongsTo(Timeframe::class);
    }

    /**
     * Get the key results for the objective.
     */
    public function keyResults(): HasMany
    {
        return $this->hasMany(KeyResult::class);
    }

    /**
     * Get the check-ins for the objective.
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * Calculate progress based on key results.
     */
    public function calculateProgress(): void
    {
        $keyResults = $this->keyResults;
        
        if ($keyResults->isEmpty()) {
            $this->progress = 0;
            return;
        }
        
        $totalProgress = $keyResults->sum('progress');
        $this->progress = $totalProgress / $keyResults->count();
        $this->save();
    }
}