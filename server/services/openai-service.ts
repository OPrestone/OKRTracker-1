import OpenAI from "openai";
import { log } from "../vite";
import { Objective, KeyResult, Team, User } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OKR recommendation types
export interface ObjectiveRecommendation {
  title: string;
  description: string;
  level: "company" | "department" | "team" | "individual";
  reasoning: string;
  suggestedKeyResults: {
    title: string;
    description: string;
    targetValue?: string;
  }[];
}

export interface KeyResultRecommendation {
  title: string;
  description: string;
  targetValue?: string;
  reasoning: string;
}

export interface OKRImprovement {
  originalObjective: Objective;
  improvedTitle?: string;
  improvedDescription?: string;
  reasoning: string;
  keyResultSuggestions?: KeyResultRecommendation[];
}

class OpenAIService {
  /**
   * Generate objective recommendations based on team and existing objectives
   */
  async generateObjectiveRecommendations(
    teamId: number,
    teamData: Team,
    existingObjectives: Objective[],
    companyObjectives: Objective[],
    count: number = 3
  ): Promise<ObjectiveRecommendation[]> {
    try {
      const prompt = this.buildObjectiveRecommendationPrompt(
        teamData,
        existingObjectives,
        companyObjectives
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert OKR consultant specialized in creating effective objectives and key results that align with business goals."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      log(`Generated ${result.recommendations?.length || 0} objective recommendations`, "openai");
      
      return (result.recommendations || []).slice(0, count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error generating objective recommendations: ${errorMessage}`, "openai");
      throw new Error(`Failed to generate objective recommendations: ${errorMessage}`);
    }
  }

  /**
   * Generate key result recommendations for a specific objective
   */
  async generateKeyResultRecommendations(
    objective: Objective,
    existingKeyResults: KeyResult[],
    count: number = 5
  ): Promise<KeyResultRecommendation[]> {
    try {
      const prompt = this.buildKeyResultRecommendationPrompt(
        objective,
        existingKeyResults
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert OKR consultant specialized in creating effective, measurable key results that drive objectives forward."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      log(`Generated ${result.recommendations?.length || 0} key result recommendations`, "openai");
      
      return (result.recommendations || []).slice(0, count);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error generating key result recommendations: ${errorMessage}`, "openai");
      throw new Error(`Failed to generate key result recommendations: ${errorMessage}`);
    }
  }

  /**
   * Analyze and improve existing OKRs
   */
  async analyzeAndImproveOKR(
    objective: Objective,
    keyResults: KeyResult[]
  ): Promise<OKRImprovement> {
    try {
      const prompt = this.buildOKRImprovementPrompt(objective, keyResults);

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert OKR coach specializing in improving the quality, measurability, and alignment of objectives and key results."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      log(`Generated OKR improvement suggestions for objective ID ${objective.id}`, "openai");
      
      return {
        originalObjective: objective,
        improvedTitle: result.improvedTitle,
        improvedDescription: result.improvedDescription,
        reasoning: result.reasoning || "No reasoning provided",
        keyResultSuggestions: result.keyResultSuggestions || []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error analyzing and improving OKR: ${errorMessage}`, "openai");
      throw new Error(`Failed to analyze and improve OKR: ${errorMessage}`);
    }
  }

  /**
   * Analyze alignment of objectives within a team
   */
  async analyzeTeamAlignment(
    teamId: number,
    teamObjectives: Objective[],
    companyObjectives: Objective[]
  ): Promise<{ 
    alignmentScore: number, 
    analysis: string,
    recommendations: string[] 
  }> {
    try {
      const prompt = this.buildTeamAlignmentPrompt(
        teamId,
        teamObjectives,
        companyObjectives
      );

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert in organizational alignment and OKR methodology, specializing in ensuring team objectives support company-level goals."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      log(`Generated alignment analysis for team ID ${teamId}`, "openai");
      
      return {
        alignmentScore: result.alignmentScore || 0,
        analysis: result.analysis || "No analysis provided",
        recommendations: result.recommendations || []
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Error analyzing team alignment: ${errorMessage}`, "openai");
      throw new Error(`Failed to analyze team alignment: ${errorMessage}`);
    }
  }

  /**
   * Build prompt for objective recommendations
   */
  private buildObjectiveRecommendationPrompt(
    team: Team,
    existingObjectives: Objective[],
    companyObjectives: Objective[]
  ): string {
    return `
      Please generate ${existingObjectives.length > 0 ? 'additional' : 'new'} objective recommendations for the "${team.name}" team.
      
      Team description: ${team.description || "No description provided"}
      
      ${companyObjectives.length > 0 
        ? `Company-level objectives to align with:
          ${companyObjectives.map(obj => `- ${obj.title}: ${obj.description || 'No description'}`).join('\n')}` 
        : 'No company-level objectives provided.'}
      
      ${existingObjectives.length > 0 
        ? `Current team objectives:
          ${existingObjectives.map(obj => `- ${obj.title}: ${obj.description || 'No description'}`).join('\n')}` 
        : 'No existing team objectives.'}
      
      For each recommendation, please provide:
      1. A clear, actionable objective title
      2. A more detailed description
      3. The appropriate level (company, department, team, or individual)
      4. Your reasoning for suggesting this objective
      5. 2-3 suggested key results that would measure success of this objective
      
      Follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound).
      Make recommendations that are ambitious but realistic.
      
      Respond in JSON format with this structure:
      {
        "recommendations": [
          {
            "title": "Objective title",
            "description": "Detailed description",
            "level": "team",
            "reasoning": "Why this objective is recommended",
            "suggestedKeyResults": [
              {
                "title": "Key result title",
                "description": "Key result description",
                "targetValue": "Optional target value"
              }
            ]
          }
        ]
      }
    `;
  }

  /**
   * Build prompt for key result recommendations
   */
  private buildKeyResultRecommendationPrompt(
    objective: Objective,
    existingKeyResults: KeyResult[]
  ): string {
    return `
      Please generate key result recommendations for the following objective:
      
      Objective: ${objective.title}
      Description: ${objective.description || "No description provided"}
      Level: ${objective.level || "unspecified"}
      
      ${existingKeyResults.length > 0 
        ? `Current key results:
          ${existingKeyResults.map(kr => 
            `- ${kr.title}${kr.description ? `: ${kr.description}` : ''}${kr.targetValue ? ` (Target: ${kr.targetValue})` : ''}`
          ).join('\n')}` 
        : 'No existing key results.'}
      
      Please provide ${existingKeyResults.length > 0 ? 'additional' : 'new'} key result recommendations that:
      1. Are clearly measurable and quantifiable
      2. Have a specific target value when applicable
      3. Directly contribute to achieving the objective
      4. Cover different aspects of the objective when possible
      5. Follow best practices for OKRs
      
      For each recommendation, include:
      1. A clear, measurable key result title
      2. A more detailed description explaining how it relates to the objective
      3. A suggested target value (when applicable)
      4. Your reasoning for suggesting this key result
      
      Respond in JSON format with this structure:
      {
        "recommendations": [
          {
            "title": "Key result title",
            "description": "Detailed description",
            "targetValue": "Optional specific target value",
            "reasoning": "Why this key result is recommended"
          }
        ]
      }
    `;
  }

  /**
   * Build prompt for OKR improvement analysis
   */
  private buildOKRImprovementPrompt(
    objective: Objective,
    keyResults: KeyResult[]
  ): string {
    return `
      Please analyze and provide improvement suggestions for the following OKR:
      
      Objective: ${objective.title}
      Description: ${objective.description || "No description provided"}
      Level: ${objective.level || "unspecified"}
      
      Key Results:
      ${keyResults.length > 0 
        ? keyResults.map(kr => 
            `- ${kr.title}${kr.description ? `: ${kr.description}` : ''}${kr.targetValue ? ` (Target: ${kr.targetValue})` : ''}`
          ).join('\n')
        : 'No key results specified.'}
      
      Please analyze this OKR and suggest improvements focusing on:
      1. Clarity and specificity of the objective
      2. Measurability of the key results
      3. Alignment with OKR best practices
      4. Potential gaps in measurement
      5. Overall quality and effectiveness
      
      Provide:
      1. An improved version of the objective title (if needed)
      2. An improved version of the objective description (if needed)
      3. Detailed reasoning for your suggestions
      4. Key result improvement suggestions
      
      Respond in JSON format with this structure:
      {
        "improvedTitle": "Improved objective title or null if no change needed",
        "improvedDescription": "Improved objective description or null if no change needed",
        "reasoning": "Detailed explanation of your analysis and recommendations",
        "keyResultSuggestions": [
          {
            "title": "Improved or new key result title",
            "description": "Detailed description",
            "targetValue": "Suggested target value if applicable",
            "reasoning": "Why this improvement is suggested"
          }
        ]
      }
    `;
  }

  /**
   * Build prompt for team alignment analysis
   */
  private buildTeamAlignmentPrompt(
    teamId: number,
    teamObjectives: Objective[],
    companyObjectives: Objective[]
  ): string {
    return `
      Please analyze the alignment between the team objectives and company objectives:
      
      Company Objectives:
      ${companyObjectives.length > 0 
        ? companyObjectives.map(obj => `- ${obj.title}: ${obj.description || 'No description'}`).join('\n')
        : 'No company objectives provided.'}
      
      Team Objectives:
      ${teamObjectives.length > 0 
        ? teamObjectives.map(obj => `- ${obj.title}: ${obj.description || 'No description'}`).join('\n')
        : 'No team objectives provided.'}
      
      Please provide:
      1. An alignment score from 1-100 indicating how well the team objectives support and align with company objectives
      2. A detailed analysis explaining your reasoning
      3. Specific recommendations to improve alignment
      
      Respond in JSON format with this structure:
      {
        "alignmentScore": 75,
        "analysis": "Detailed analysis of the alignment between team and company objectives",
        "recommendations": [
          "Specific recommendation to improve alignment",
          "Additional recommendation"
        ]
      }
    `;
  }
}

export const openAIService = new OpenAIService();