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
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objective_id')->nullable()->constrained('objectives')->onDelete('cascade');
            $table->foreignId('key_result_id')->nullable()->constrained('key_results')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->integer('progress')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Ensure at least one of objective_id or key_result_id is set
            $table->check('objective_id IS NOT NULL OR key_result_id IS NOT NULL');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};