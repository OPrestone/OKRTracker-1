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
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('objective_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('key_result_id')->nullable()->constrained()->onDelete('cascade');
            $table->decimal('previous_value', 15, 2)->nullable();
            $table->decimal('new_value', 15, 2)->nullable();
            $table->decimal('progress_change', 5, 2)->nullable();
            $table->text('note')->nullable();
            $table->enum('mood', ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'])->nullable();
            $table->integer('confidence')->nullable(); // 1-10 scale
            $table->enum('status', ['on_track', 'at_risk', 'off_track'])->nullable();
            $table->timestamps();
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