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
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'objective_id',
        'key_result_id',
        'previous_value',
        'new_value',
        'progress_change',
        'note',
        'mood',
        'confidence',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'previous_value' => 'float',
        'new_value' => 'float',
        'progress_change' => 'float',
        'confidence' => 'integer',
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
     * Calculate progress change percentage.
     */
    public function calculateProgressChange(): void
    {
        if ($this->key_result_id) {
            $keyResult = $this->keyResult;
            
            if ($keyResult && $keyResult->target_value !== null && $keyResult->target_value != $keyResult->start_value) {
                $totalRange = abs($keyResult->target_value - $keyResult->start_value);
                $valueChange = abs($this->new_value - $this->previous_value);
                $this->progress_change = ($valueChange / $totalRange) * 100;
            } else {
                $this->progress_change = 0;
            }
        } else {
            $this->progress_change = $this->new_value - $this->previous_value;
        }
        
        $this->save();
    }

    /**
     * Update the associated entity with the new value.
     */
    public function updateEntity(): void
    {
        if ($this->key_result_id) {
            $keyResult = $this->keyResult;
            if ($keyResult) {
                $keyResult->current_value = $this->new_value;
                $keyResult->save();
                $keyResult->calculateProgress();
            }
        } elseif ($this->objective_id) {
            $objective = $this->objective;
            if ($objective) {
                $objective->progress = $this->new_value;
                $objective->save();
            }
        }
    }
}