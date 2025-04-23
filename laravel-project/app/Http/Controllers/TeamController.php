<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TeamController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the teams.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Team::with(['leader', 'parent']);
        
        // Filter by parent
        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        }
        
        // Include only root teams
        if ($request->has('root_only') && $request->root_only) {
            $query->whereNull('parent_id');
        }
        
        $teams = $query->orderBy('name')->get();
        
        return response()->json($teams);
    }

    /**
     * Store a newly created team in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:teams,id',
            'leader_id' => 'nullable|exists:users,id',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $team = Team::create($request->all());
        
        // Add current user as a member if not already added
        $team->members()->syncWithoutDetaching([Auth::id() => ['role' => 'admin']]);
        
        // If leader_id is provided, make sure they're a member too
        if ($request->leader_id && $request->leader_id != Auth::id()) {
            $team->members()->syncWithoutDetaching([
                $request->leader_id => ['role' => 'leader']
            ]);
        }
        
        return response()->json($team->load(['leader', 'parent', 'members']), 201);
    }

    /**
     * Display the specified team.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $team = Team::with(['leader', 'parent', 'members', 'children'])->findOrFail($id);
        
        return response()->json($team);
    }

    /**
     * Update the specified team in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:teams,id',
            'leader_id' => 'nullable|exists:users,id',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Prevent circular reference
        if ($request->parent_id == $id) {
            return response()->json([
                'errors' => ['parent_id' => ['A team cannot be its own parent.']]
            ], 422);
        }
        
        $team->update($request->all());
        
        // If leader_id is provided, make sure they're a member too
        if ($request->has('leader_id') && $request->leader_id) {
            $team->members()->syncWithoutDetaching([
                $request->leader_id => ['role' => 'leader']
            ]);
        }
        
        return response()->json($team->fresh(['leader', 'parent', 'members']));
    }

    /**
     * Remove the specified team from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $team = Team::findOrFail($id);
        
        // Check if the team has children
        if ($team->children()->exists()) {
            return response()->json([
                'errors' => ['team' => ['Cannot delete a team that has child teams.']]
            ], 422);
        }
        
        $team->delete();
        
        return response()->json(null, 204);
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
        $team = Team::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:member,leader,admin',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $team->members()->syncWithoutDetaching([
            $request->user_id => ['role' => $request->role]
        ]);
        
        // If role is leader, update team leader
        if ($request->role === 'leader') {
            $team->leader_id = $request->user_id;
            $team->save();
        }
        
        return response()->json($team->fresh(['members']));
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
        $team = Team::findOrFail($id);
        
        // Check if user is the leader
        if ($team->leader_id == $userId) {
            return response()->json([
                'errors' => ['user' => ['Cannot remove the team leader. Assign a new leader first.']]
            ], 422);
        }
        
        $team->members()->detach($userId);
        
        return response()->json($team->fresh(['members']));
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
        $team = Team::findOrFail($id);
        $user = User::findOrFail($userId);
        
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:member,leader,admin',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $team->members()->updateExistingPivot($userId, [
            'role' => $request->role
        ]);
        
        // If role is leader, update team leader
        if ($request->role === 'leader') {
            $team->leader_id = $userId;
            $team->save();
        } elseif ($team->leader_id == $userId && $request->role !== 'leader') {
            // If current leader is being demoted, remove leader reference
            $team->leader_id = null;
            $team->save();
        }
        
        return response()->json($team->fresh(['members']));
    }
}