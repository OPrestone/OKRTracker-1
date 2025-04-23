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
            $table->foreignId('objective_id')->constrained('objectives')->onDelete('cascade');
            $table->foreignId('assigned_to_id')->nullable()->constrained('users');
            $table->string('target_value')->nullable();
            $table->string('current_value')->nullable();
            $table->string('start_value')->nullable();
            $table->integer('progress')->default(0);
            $table->string('status')->default('not_started');
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