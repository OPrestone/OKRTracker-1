<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cadence extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'period_type',
        'duration',
        'description',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'duration' => 'integer',
    ];

    /**
     * Get the timeframes for the cadence.
     */
    public function timeframes(): HasMany
    {
        return $this->hasMany(Timeframe::class);
    }

    /**
     * Create the next timeframe based on the cadence settings.
     */
    public function createNextTimeframe(): Timeframe
    {
        $latestTimeframe = $this->timeframes()->latest('end_date')->first();
        
        $startDate = $latestTimeframe ? $latestTimeframe->end_date->addDay() : now();
        $endDate = null;
        
        // Calculate end date based on period type and duration
        switch ($this->period_type) {
            case 'weekly':
                $endDate = $startDate->copy()->addWeeks($this->duration)->subDay();
                break;
            case 'monthly':
                $endDate = $startDate->copy()->addMonths($this->duration)->subDay();
                break;
            case 'quarterly':
                $endDate = $startDate->copy()->addMonths($this->duration * 3)->subDay();
                break;
            case 'yearly':
                $endDate = $startDate->copy()->addYears($this->duration)->subDay();
                break;
            default:
                $endDate = $startDate->copy()->addMonths($this->duration)->subDay();
        }
        
        // Generate name based on period type (e.g., "Q1 2023", "January 2023")
        $name = $this->generateTimeframeName($startDate, $this->period_type);
        
        return $this->timeframes()->create([
            'name' => $name,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'upcoming',
            'description' => "Auto-generated {$this->name} timeframe",
        ]);
    }

    /**
     * Generate a name for the timeframe based on its start date and period type.
     */
    protected function generateTimeframeName($startDate, $periodType): string
    {
        switch ($periodType) {
            case 'weekly':
                return 'Week ' . $startDate->weekOfYear . ', ' . $startDate->year;
            case 'monthly':
                return $startDate->format('F Y');
            case 'quarterly':
                return 'Q' . ceil($startDate->month / 3) . ' ' . $startDate->year;
            case 'yearly':
                return $startDate->year;
            default:
                return $startDate->format('F Y');
        }
    }
}