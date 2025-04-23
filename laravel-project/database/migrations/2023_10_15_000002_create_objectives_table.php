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
        Schema::create('objectives', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('level')->comment('company, department, team, individual');
            $table->foreignId('owner_id')->constrained('users');
            $table->foreignId('team_id')->nullable()->constrained('teams');
            $table->foreignId('timeframe_id')->constrained('timeframes');
            $table->foreignId('parent_id')->nullable()->constrained('objectives')->onDelete('set null');
            $table->string('status')->default('not_started');
            $table->integer('progress')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objectives');
    }
};