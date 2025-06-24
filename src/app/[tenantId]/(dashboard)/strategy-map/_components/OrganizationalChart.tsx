"use client";

import { TenantContext } from "@/contexts/TenantContext";
import { getAllObjectives } from "@/lib/queries/objectives";
import { getStrategicIntents } from "@/lib/queries/strategic-intents";
import { Tenant } from "@/util/schema";
import { useQuery } from "@tanstack/react-query";
import {
	addEdge,
	BaseEdge,
	Controls,
	EdgeProps,
	Handle,
	MiniMap,
	Node,
	NodeProps,
	OnConnect,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { ActivityIcon, Lightbulb } from "lucide-react";
import { useCallback, useContext, useEffect } from "react";

function StepEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
	const centerY = (targetY - sourceY) / 2 + sourceY;

	const edgePath = `M ${sourceX} ${sourceY} L ${sourceX} ${centerY} L ${targetX} ${centerY} L ${targetX} ${targetY}`;

	return <BaseEdge id={id} path={edgePath} />;
}

const edgeTypes = {
	step: StepEdge,
};

const initialNodes = [
	{
		id: "3",
		position: { x: 0, y: 0 },
		data: { label: "3" },
		type: "intentNode",
	},
	{
		id: "4",
		position: { x: 400, y: 200 },
		data: { label: "4" },
		type: "goalNode",
	},
	{
		id: "5",
		position: { x: -200, y: 200 },
		data: { label: "5" },
		type: "goalNode",
	},
];
const initialEdges = [
	{ id: "e1-2", source: "1", target: "2", type: "step" },
	{ id: "e2-3", source: "3", target: "4", type: "step" },
	{ id: "e3-4", source: "3", target: "5", type: "step" },
];

type IntentNode = Node<{ title: string }, "string">;

const IntentNode = ({ data }: NodeProps<IntentNode>) => {
	return (
		<div className="intent-node border border-green-300 p-4 bg-green-100 rounded max-w-[600px]">
			<div className="flex gap-3">
				<Lightbulb className="text-green-700 self-center" />
				<div>
					<h3 className="font-semibold text-green-700">Strategic Intent</h3>
					<p className="text-sm text-green-700">{data.title}</p>
				</div>
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
};

type GoalNode = Node<{ title: string }, "string">;

const GoalNode = ({ data }: NodeProps<GoalNode>) => {
	return (
		<div className="goal-node border p-4 bg-white rounded w-[400px]">
			<div className="flex gap-3">
				<ActivityIcon />
				<div>
					<h3 className="font-semibold">Team Goals Intent</h3>
					<p className="text-sm">{data.title}</p>
				</div>
			</div>
			<Handle type="target" position={Position.Top} />
		</div>
	);
};

const nodeTypes = {
	intentNode: IntentNode,
	goalNode: GoalNode,
};

const OrganizationalChart = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const tenant = useContext(TenantContext) as Tenant;

	const { data: strategicIntent, isLoading: strategicIntentLoading } = useQuery({
		queryKey: ["strategic-intents", tenant.id],
		queryFn: async () => {
			const strategicIntents = await getStrategicIntents(tenant.id);
			if ("error" in strategicIntents) {
				console.error("Error fetching intents:", strategicIntents.error);
				throw new Error(strategicIntents.error);
			}
			return strategicIntents || [];
		},
	});

	const { data: objectives, isLoading: objectivesLoading } = useQuery({
		queryKey: ["objectives", tenant.id],
		queryFn: async () => {
			const objectives = await getAllObjectives(tenant.id);
			if ("error" in objectives) {
				console.error("Error fetching objectives:", objectives.error);
				throw new Error(objectives.error);
			}
			return objectives || [];
		},
	});

	const onConnect: OnConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges]
	);

	const handleNodes = () => {
		if (!strategicIntent || strategicIntent.length === 0) {
			console.warn("No strategic intent data available");
			return;
		}
		console.log("Handling nodes with strategic intent:", strategicIntent);
		const newNodes = strategicIntent.map((intent) => ({
			id: intent.id,
			position: { x: 0, y: 0 },
			data: { title: intent.title, label: intent.title },
			type: "intentNode",
		}));
		let o: Array<{
			id: string;
			position: { x: number; y: number };
			data: { title: string; label: string };
			type: string;
		}> = [];
		let oEdges = [];
		if (objectives && objectives.length > 0) {
			const spacing = 500;
			const startX = -((objectives.length - 1) * spacing) / 2;
			o = objectives.map((objective, index) => ({
				id: objective.id,
				position: { x: startX + index * spacing - 60, y: 200 },
				data: { title: objective.title, label: objective.title },
				type: "goalNode",
			}));
			oEdges = o.map((node) => ({
				id: `e-${newNodes[0].id}-${node.id}`,
				source: newNodes[0].id,
				target: node.id,
				type: "step",
			}));
			setEdges(oEdges);
			console.log("Objectives found:", objectives);
		}
		setNodes([newNodes[0], ...o]);
		console.log("New nodes:", newNodes, o);
	};

	useEffect(() => {
		handleNodes();
	}, [strategicIntent, objectives]);

	if (strategicIntentLoading || objectivesLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div style={{ height: "100vh" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
			>
				<Controls />
				<MiniMap />
			</ReactFlow>
		</div>
	);
};

export default OrganizationalChart;
