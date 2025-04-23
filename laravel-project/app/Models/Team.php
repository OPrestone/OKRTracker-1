<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
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
        'parent_id',
        'leader_id',
        'icon',
        'color',
    ];

    /**
     * Get the parent team that this team belongs to.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'parent_id');
    }

    /**
     * Get the child teams for this team.
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
     * Get the members of this team.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_user')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * Get the objectives for this team.
     */
    public function objectives(): HasMany
    {
        return $this->hasMany(Objective::class, 'team_id');
    }

    /**
     * Get all ancestors of this team.
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
     * Check if this team is a descendant of the given team.
     *
     * @param Team $team
     * @return bool
     */
    public function isDescendantOf(Team $team)
    {
        return $this->ancestors()->contains('id', $team->id);
    }

    /**
     * Get all descendants of this team.
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

    /**
     * Check if this team is an ancestor of the given team.
     *
     * @param Team $team
     * @return bool
     */
    public function isAncestorOf(Team $team)
    {
        return $this->descendants()->contains('id', $team->id);
    }
}