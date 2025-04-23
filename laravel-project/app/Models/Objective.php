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
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'level',
        'owner_id',
        'team_id',
        'timeframe_id',
        'parent_id',
        'status',
        'progress'
    ];

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = ['keyResults'];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'progress' => 'integer',
    ];

    /**
     * Get the owner of the objective.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the team that owns the objective.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the timeframe for this objective.
     */
    public function timeframe(): BelongsTo
    {
        return $this->belongsTo(Timeframe::class);
    }

    /**
     * Get the parent objective.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Objective::class, 'parent_id');
    }

    /**
     * Get the child objectives.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Objective::class, 'parent_id');
    }

    /**
     * Get the key results for this objective.
     */
    public function keyResults(): HasMany
    {
        return $this->hasMany(KeyResult::class);
    }

    /**
     * Get the check-ins for this objective.
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * Calculate and update progress based on key results.
     *
     * @return int
     */
    public function calculateProgress(): int
    {
        $keyResults = $this->keyResults;
        
        if ($keyResults->isEmpty()) {
            return $this->progress;
        }
        
        $totalProgress = $keyResults->sum('progress');
        $count = $keyResults->count();
        $averageProgress = round($totalProgress / $count);
        
        $this->progress = $averageProgress;
        $this->updateStatus();
        $this->save();
        
        return $this->progress;
    }

    /**
     * Update status based on progress.
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
     * Check if this objective is completed.
     *
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed' || $this->progress >= 100;
    }

    /**
     * Get all ancestors of this objective.
     *
     * @return \Illuminate\Support\Collection
     */
    public function ancestors()
    {
        $ancestors = collect();
        $parent = $this->parent;

        while ($parent) {
            $ancestors->push($parent);
            $parent = $parent->parent;
        }

        return $ancestors;
    }

    /**
     * Get all descendants of this objective.
     *
     * @return \Illuminate\Support\Collection
     */
    public function descendants()
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->descendants());
        }
        
        return $descendants;
    }
}