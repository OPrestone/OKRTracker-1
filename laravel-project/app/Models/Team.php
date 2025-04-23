<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'parent_id',
        'leader_id',
        'icon',
        'color',
    ];

    /**
     * Get the parent team.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'parent_id');
    }

    /**
     * Get the child teams.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Team::class, 'parent_id');
    }

    /**
     * Get the team leader.
     */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    /**
     * Get the team members.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the objectives for the team.
     */
    public function objectives(): HasMany
    {
        return $this->hasMany(Objective::class);
    }

    /**
     * Get the active objectives for the team.
     */
    public function activeObjectives()
    {
        return $this->objectives()->where('status', 'active');
    }

    /**
     * Get the team's overall progress.
     */
    public function calculateProgress(): float
    {
        $objectives = $this->activeObjectives;
        
        if ($objectives->isEmpty()) {
            return 0;
        }
        
        $totalProgress = $objectives->sum('progress');
        return $totalProgress / $objectives->count();
    }
}