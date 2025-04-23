<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'objective_id',
        'key_result_id',
        'user_id',
        'progress',
        'notes'
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
     * Get the user that created the check-in.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the objective associated with the check-in.
     */
    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }

    /**
     * Get the key result associated with the check-in.
     */
    public function keyResult(): BelongsTo
    {
        return $this->belongsTo(KeyResult::class);
    }

    /**
     * Scope a query to only include check-ins for a specific user.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include check-ins for a specific objective.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $objectiveId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByObjective($query, $objectiveId)
    {
        return $query->where('objective_id', $objectiveId);
    }

    /**
     * Scope a query to only include check-ins for a specific key result.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $keyResultId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByKeyResult($query, $keyResultId)
    {
        return $query->where('key_result_id', $keyResultId);
    }

    /**
     * Scope a query to recent check-ins.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    /**
     * Create a check-in and update related progress.
     *
     * @param array $attributes
     * @return static
     */
    public static function createWithProgressUpdate(array $attributes)
    {
        $checkIn = self::create($attributes);
        
        // Update progress if provided
        if (isset($attributes['progress'])) {
            $progress = (int) $attributes['progress'];
            
            // If this is for a key result, update its progress
            if ($checkIn->key_result_id) {
                $keyResult = $checkIn->keyResult;
                if ($keyResult) {
                    $keyResult->updateProgress($progress);
                }
            } 
            // If this is for an objective directly, update its progress
            elseif ($checkIn->objective_id) {
                $objective = $checkIn->objective;
                if ($objective) {
                    $objective->progress = $progress;
                    $objective->updateStatus();
                    $objective->save();
                }
            }
        }
        
        return $checkIn;
    }
}