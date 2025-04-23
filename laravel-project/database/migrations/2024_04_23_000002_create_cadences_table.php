<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cadences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('period_type', ['weekly', 'monthly', 'quarterly', 'yearly'])->default('quarterly');
            $table->integer('duration')->default(1);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cadences');
    }
};