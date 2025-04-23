<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TeamController extends Controller
{
    /**
     * Display a listing of teams.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Team::with(['leader', 'members', 'objectives' => function($query) {
            $query->latest()->limit(5);
        }]);
        
        // Filter by department if provided
        if ($request->has('department') && $request->department) {
            $query->where('department', $request->department);
        }
        
        // Filter by search term if provided
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }
        
        $teams = $query->orderBy('name')->paginate(15);
        
        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }

    /**
     * Store a newly created team.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:teams',
            'description' => 'nullable|string',
            'department' => 'required|string|max:100',
            'leader_id' => 'required|exists:users,id',
            'members' => 'nullable|array',
            'members.*' => 'exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $team = Team::create([
                'name' => $request->name,
                'description' => $request->description,
                'department' => $request->department,
                'leader_id' => $request->leader_id,
            ]);
            
            // Add leader as a member with role 'leader'
            $team->members()->attach($request->leader_id, ['role' => 'leader']);
            
            // Add other members if provided
            if ($request->has('members') && count($request->members) > 0) {
                foreach ($request->members as $memberId) {
                    if ($memberId != $request->leader_id) {
                        $team->members()->attach($memberId, ['role' => 'member']);
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Team created successfully',
                'data' => $team->load(['leader', 'members'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error creating team', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create team',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified team.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $team = Team::with([
                'leader', 
                'members', 
                'objectives' => function($query) {
                    $query->with(['keyResults', 'owner', 'timeframe']);
                }
            ])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $team
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Team not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified team.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255|unique:teams,name,' . $id,
            'description' => 'nullable|string',
            'department' => 'string|max:100',
            'leader_id' => 'exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $team = Team::findOrFail($id);
            
            // If leader is changing, update the roles
            if ($request->has('leader_id') && $request->leader_id != $team->leader_id) {
                // Update old leader role to member
                $team->members()->updateExistingPivot($team->leader_id, ['role' => 'member']);
                
                // Add new leader as member if not already
                if (!$team->members->contains($request->leader_id)) {
                    $team->members()->attach($request->leader_id, ['role' => 'leader']);
                } else {
                    $team->members()->updateExistingPivot($request->leader_id, ['role' => 'leader']);
                }
            }
            
            $team->update($request->all());
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Team updated successfully',
                'data' => $team->load(['leader', 'members'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating team', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update team',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }

    /**
     * Remove the specified team.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $team = Team::findOrFail($id);
            
            // Detach all members
            $team->members()->detach();
            
            $team->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Team deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete team',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Add a member to the team.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function addMember(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:member,leader',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $team = Team::findOrFail($id);
            
            // Check if user is already a member
            if ($team->members->contains($request->user_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already a member of this team'
                ], 422);
            }
            
            // If adding as leader, update current leader
            if ($request->role === 'leader') {
                // Update old leader role to member
                $team->members()->updateExistingPivot($team->leader_id, ['role' => 'member']);
                
                // Update team's leader
                $team->leader_id = $request->user_id;
                $team->save();
            }
            
            // Add member with specified role
            $team->members()->attach($request->user_id, ['role' => $request->role]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Member added successfully',
                'data' => $team->load(['leader', 'members'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error adding team member', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add member to team',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Remove a member from the team.
     *
     * @param  int  $id
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function removeMember($id, $userId)
    {
        try {
            DB::beginTransaction();
            
            $team = Team::findOrFail($id);
            
            // Check if user is a member
            if (!$team->members->contains($userId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a member of this team'
                ], 422);
            }
            
            // Cannot remove the leader
            if ($team->leader_id == $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot remove the team leader. Please assign a new leader first.'
                ], 422);
            }
            
            // Remove the member
            $team->members()->detach($userId);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Member removed successfully',
                'data' => $team->fresh()->load(['leader', 'members'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error removing team member', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove member from team',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Update a member's role in the team.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function updateMemberRole(Request $request, $id, $userId)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:member,leader',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $team = Team::findOrFail($id);
            
            // Check if user is a member
            if (!$team->members->contains($userId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a member of this team'
                ], 422);
            }
            
            // If setting as leader, update current leader
            if ($request->role === 'leader') {
                // Update old leader role to member
                $team->members()->updateExistingPivot($team->leader_id, ['role' => 'member']);
                
                // Update team's leader
                $team->leader_id = $userId;
                $team->save();
            } else {
                // Cannot demote the current leader without assigning a new one
                if ($team->leader_id == $userId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot demote the team leader. Please assign a new leader first.'
                    ], 422);
                }
            }
            
            // Update member's role
            $team->members()->updateExistingPivot($userId, ['role' => $request->role]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Member role updated successfully',
                'data' => $team->fresh()->load(['leader', 'members'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error updating team member role', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update member role',
                'error' => $e->getMessage()
            ], $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ? 404 : 500);
        }
    }
    
    /**
     * Get the teams for the current user.
     *
     * @return \Illuminate\Http\Response
     */
    public function myTeams()
    {
        $userId = Auth::id();
        
        $teams = User::findOrFail($userId)->teams()
            ->with(['leader', 'objectives' => function($query) {
                $query->latest()->limit(3);
            }])
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $teams
        ]);
    }
    
    /**
     * Get all departments.
     *
     * @return \Illuminate\Http\Response
     */
    public function getDepartments()
    {
        $departments = Team::select('department')
            ->distinct()
            ->orderBy('department')
            ->pluck('department');
        
        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }
}