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
        Schema::create('key_results', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('objective_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['numeric', 'percentage', 'binary', 'currency'])->default('numeric');
            $table->decimal('target_value', 15, 2)->nullable();
            $table->decimal('current_value', 15, 2)->nullable();
            $table->decimal('start_value', 15, 2)->nullable();
            $table->string('format')->nullable(); // For display formatting
            $table->decimal('progress', 5, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->enum('status', ['not_started', 'in_progress', 'at_risk', 'completed'])->default('not_started');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('key_results');
    }
};