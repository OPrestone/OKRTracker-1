<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOkrTemplatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('okr_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('category', 100);
            $table->string('department', 100);
            $table->json('template_data');
            $table->boolean('is_ai_generated')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            
            // Add foreign key if users table exists
            if (Schema::hasTable('users')) {
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            }
            
            // Add indexes for common queries
            $table->index('category');
            $table->index('department');
            $table->index('is_ai_generated');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('okr_templates');
    }
}