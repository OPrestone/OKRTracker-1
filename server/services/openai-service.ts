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
      log(`Error generating objective recommendations: ${errorMessage}. Using fallback recommendations.`, "openai");
      
      // Return fallback recommendations instead of throwing an error
      return this.getFallbackObjectiveRecommendations(teamData, companyObjectives, count);
    }
  }
  
  /**
   * Provides fallback objective recommendations when OpenAI API is unavailable
   */
  private getFallbackObjectiveRecommendations(
    team: Team,
    companyObjectives: Objective[],
    count: number = 3
  ): ObjectiveRecommendation[] {
    const fallbackRecommendations: ObjectiveRecommendation[] = [
      {
        title: `Improve ${team.name} efficiency by 25%`,
        description: "Implement processes and tools to significantly boost operational efficiency within the team",
        level: "team",
        reasoning: "Efficiency improvements directly contribute to team productivity and resource optimization",
        suggestedKeyResults: [
          {
            title: "Reduce average task completion time by 20%",
            description: "Measure and optimize the time taken to complete routine tasks and projects"
          },
          {
            title: "Implement 3 automation tools for repetitive processes",
            description: "Identify and automate time-consuming manual processes"
          },
          {
            title: "Conduct bi-weekly process optimization reviews",
            description: "Regular team meetings to identify bottlenecks and improvement opportunities"
          }
        ]
      },
      {
        title: `Enhance ${team.name} collaboration and knowledge sharing`,
        description: "Create systems and practices to improve how team members work together and share information",
        level: "team",
        reasoning: "Better collaboration leads to improved outcomes and reduces siloed knowledge",
        suggestedKeyResults: [
          {
            title: "Establish a team knowledge base with 95% documentation coverage",
            description: "Create comprehensive documentation for all key processes and projects"
          },
          {
            title: "Implement weekly knowledge sharing sessions with 90% participation",
            description: "Regular meetings where team members share expertise and learnings"
          },
          {
            title: "Achieve 30% increase in cross-functional project collaboration",
            description: "Measure involvement of team members in projects outside their primary focus area"
          }
        ]
      },
      {
        title: `Develop ${team.name} member skills and capabilities`,
        description: "Focus on upskilling team members in key competencies relevant to current and future needs",
        level: "team",
        reasoning: "Continuous skill development ensures the team can adapt to changing requirements and technologies",
        suggestedKeyResults: [
          {
            title: "Complete 5 team training sessions on emerging technologies/methodologies",
            description: "Organized learning opportunities focused on relevant skills"
          },
          {
            title: "Create individual development plans for 100% of team members",
            description: "Personalized growth plans aligned with team and individual goals"
          },
          {
            title: "Achieve 90% completion rate for identified learning objectives",
            description: "Track progress against established development metrics"
          }
        ]
      },
      {
        title: "Increase customer satisfaction score by 15 points",
        description: "Focus on improving the customer experience through product/service enhancements",
        level: "team",
        reasoning: "Higher customer satisfaction leads to better retention and business growth",
        suggestedKeyResults: [
          {
            title: "Reduce customer support response time by 50%",
            description: "Optimize the process for addressing customer inquiries and issues"
          },
          {
            title: "Implement 3 key product/service improvements based on customer feedback",
            description: "Identify and deliver the highest impact improvements"
          },
          {
            title: "Increase customer survey participation by 40%",
            description: "Ensure more comprehensive and representative feedback collection"
          }
        ]
      },
      {
        title: "Expand market reach and visibility",
        description: "Increase brand awareness and market penetration through strategic initiatives",
        level: "team",
        reasoning: "Greater market presence creates more opportunities for business growth",
        suggestedKeyResults: [
          {
            title: "Launch 2 new marketing campaigns targeting underserved segments",
            description: "Identify and approach new potential customer groups"
          },
          {
            title: "Increase social media engagement by 35%",
            description: "Improve content strategy and community management"
          },
          {
            title: "Generate 25% more qualified leads",
            description: "Enhance lead generation through optimized marketing funnels"
          }
        ]
      }
    ];
    
    // Include alignment with company objectives if available
    if (companyObjectives.length > 0) {
      companyObjectives.slice(0, 2).forEach(compObj => {
        fallbackRecommendations.push({
          title: `Support company objective: ${compObj.title.substring(0, 40)}...`,
          description: `Align team efforts to contribute directly to the company-level objective: ${compObj.title}`,
          level: "team",
          reasoning: "Direct alignment with company objectives ensures cohesive organizational progress",
          suggestedKeyResults: [
            {
              title: `Contribute to ${compObj.title.substring(0, 30)}... through team-specific initiatives`,
              description: "Identify specific ways the team can support this company objective"
            },
            {
              title: "Establish quarterly alignment reviews with stakeholders",
              description: "Regular check-ins to ensure continued alignment with company goals"
            },
            {
              title: "Develop 3 metrics to track team contribution to company objective",
              description: "Create measurable indicators of how team efforts impact company goals"
            }
          ]
        });
      });
    }
    
    return fallbackRecommendations.slice(0, count);
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
      log(`Error generating key result recommendations: ${errorMessage}. Using fallback recommendations.`, "openai");
      
      // Return fallback recommendations instead of throwing an error
      return this.getFallbackKeyResultRecommendations(objective, count);
    }
  }
  
  /**
   * Provides fallback key result recommendations when OpenAI API is unavailable
   */
  private getFallbackKeyResultRecommendations(
    objective: Objective,
    count: number = 5
  ): KeyResultRecommendation[] {
    // Generic key results that can be adapted to various objectives
    const fallbackRecommendations: KeyResultRecommendation[] = [
      {
        title: `Achieve a 25% increase in ${objective.title.split(' ').slice(0, 3).join(' ')}`,
        description: "Measure and improve on core metrics related to this objective",
        targetValue: "25% increase",
        reasoning: "Quantifying improvement with a percentage target provides a clear measure of success"
      },
      {
        title: `Complete 5 key initiatives to support ${objective.title.split(' ').slice(0, 3).join(' ')}`,
        description: "Execute specific project milestones that drive this objective forward",
        targetValue: "5 completed initiatives",
        reasoning: "Breaking down the objective into concrete projects creates actionable steps"
      },
      {
        title: "Implement automated tracking and weekly reporting system",
        description: "Create a systematic approach to measuring progress on this objective",
        reasoning: "Regular measurement and visibility is critical for OKR success"
      },
      {
        title: "Achieve 95% team alignment on objective approach",
        description: "Ensure all team members understand and are aligned on how to achieve this objective",
        targetValue: "95% alignment score",
        reasoning: "Team alignment is crucial for coordinated execution"
      },
      {
        title: "Obtain stakeholder approval for all execution plans",
        description: "Ensure leadership and key stakeholders approve the approach to achieve the objective",
        reasoning: "Stakeholder alignment removes barriers to successful execution"
      },
      {
        title: "Create detailed documentation for all processes",
        description: "Document methodologies, procedures, and best practices related to this objective",
        targetValue: "100% process documentation",
        reasoning: "Documentation ensures consistency and sustainability of progress"
      },
      {
        title: "Recruit and onboard 2 specialists with required expertise",
        description: "Identify and bring on talent with skills specifically needed for this objective",
        targetValue: "2 specialists",
        reasoning: "Having the right talent is often critical to OKR achievement"
      }
    ];
    
    // Add some domain-specific recommendations based on objective title keywords
    const lowerTitle = objective.title.toLowerCase();
    
    if (lowerTitle.includes("customer") || lowerTitle.includes("client") || lowerTitle.includes("user")) {
      fallbackRecommendations.push(
        {
          title: "Increase Net Promoter Score (NPS) by 15 points",
          description: "Measure customer satisfaction and loyalty through NPS surveys",
          targetValue: "+15 points",
          reasoning: "NPS is a strong indicator of customer satisfaction and future growth"
        },
        {
          title: "Reduce customer churn rate by 20%",
          description: "Implement retention strategies to keep existing customers",
          targetValue: "20% reduction",
          reasoning: "Customer retention is typically more cost-effective than acquisition"
        }
      );
    }
    
    if (lowerTitle.includes("market") || lowerTitle.includes("growth") || lowerTitle.includes("expansion")) {
      fallbackRecommendations.push(
        {
          title: "Enter 2 new market segments",
          description: "Identify and successfully launch in new target markets",
          targetValue: "2 new markets",
          reasoning: "Market expansion is a key driver of business growth"
        },
        {
          title: "Achieve 30% year-over-year revenue growth",
          description: "Drive significant revenue increase through various growth initiatives",
          targetValue: "30% YoY growth",
          reasoning: "Revenue growth is a primary indicator of successful market expansion"
        }
      );
    }
    
    if (lowerTitle.includes("product") || lowerTitle.includes("develop") || lowerTitle.includes("launch")) {
      fallbackRecommendations.push(
        {
          title: "Launch product with 90% of planned features",
          description: "Successfully release the product with most critical features intact",
          targetValue: "90% feature completion",
          reasoning: "Feature completion is a key measure of successful product development"
        },
        {
          title: "Achieve less than 5 critical bugs per 1000 lines of code",
          description: "Maintain high code quality standards during development",
          targetValue: "<5 bugs per 1000 LOC",
          reasoning: "Code quality directly impacts product stability and maintenance costs"
        }
      );
    }
    
    if (lowerTitle.includes("team") || lowerTitle.includes("culture") || lowerTitle.includes("employee")) {
      fallbackRecommendations.push(
        {
          title: "Improve employee satisfaction score by 20%",
          description: "Enhance team morale and job satisfaction through targeted initiatives",
          targetValue: "20% improvement",
          reasoning: "Employee satisfaction directly correlates with productivity and retention"
        },
        {
          title: "Reduce voluntary turnover rate by 25%",
          description: "Implement retention strategies to keep valuable team members",
          targetValue: "25% reduction",
          reasoning: "Lower turnover reduces costs and maintains institutional knowledge"
        }
      );
    }
    
    // Randomize order a bit to avoid always showing the same recommendations
    return fallbackRecommendations
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
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
      log(`Error analyzing and improving OKR: ${errorMessage}. Using fallback suggestions.`, "openai");
      
      // Return fallback improvement suggestions
      return this.getFallbackOKRImprovement(objective, keyResults);
    }
  }
  
  /**
   * Provides fallback OKR improvement suggestions when OpenAI API is unavailable
   */
  private getFallbackOKRImprovement(
    objective: Objective,
    keyResults: KeyResult[]
  ): OKRImprovement {
    // Generic title improvements
    let titleSuggestion = objective.title;
    let titleReasoning = "";
    
    // Check if title has common issues and provide improvements
    if (objective.title.length > 60) {
      titleSuggestion = objective.title.substring(0, 50) + "...";
      titleReasoning = "The objective title is too long. A shorter, more concise title will be easier to remember and communicate.";
    } else if (objective.title.toLowerCase().startsWith("improve") || 
               objective.title.toLowerCase().startsWith("increase") || 
               objective.title.toLowerCase().startsWith("enhance")) {
      // Title seems fine if it starts with action verbs
      titleSuggestion = objective.title;
      titleReasoning = "The objective title is action-oriented, which is good. It clearly states what you aim to accomplish.";
    } else {
      // Add an action verb if it doesn't have one
      titleSuggestion = "Improve " + objective.title;
      titleReasoning = "Adding an action verb makes the objective more outcome-focused and clear about the desired change.";
    }
    
    // Generic description improvements
    let descriptionSuggestion = objective.description || "";
    if (!objective.description || objective.description.length < 30) {
      descriptionSuggestion = `Focusing on ${objective.title} will help our team achieve its strategic goals by improving key metrics and addressing important challenges in our domain.`;
    }
    
    // Generate key result suggestions based on the objective
    const keyResultSuggestions: KeyResultRecommendation[] = [];
    
    // If no key results exist, suggest some basic ones
    if (keyResults.length === 0) {
      keyResultSuggestions.push({
        title: `Increase completion rate of ${objective.title.split(' ').slice(0, 3).join(' ')} by 30%`,
        description: "Track and measure the completion rate of key initiatives related to this objective",
        targetValue: "30% increase",
        reasoning: "Adding a quantifiable target gives this objective clear success criteria"
      });
      
      keyResultSuggestions.push({
        title: "Implement bi-weekly progress tracking for this objective",
        description: "Set up a system to regularly monitor and assess progress",
        reasoning: "Regular tracking increases accountability and helps identify issues early"
      });
    } else {
      // Analyze existing key results and suggest improvements
      keyResults.forEach(kr => {
        if (!kr.targetValue) {
          keyResultSuggestions.push({
            title: kr.title,
            description: kr.description || "Add a more detailed description",
            targetValue: "Add a specific numeric target here (e.g., 30% increase, 95% completion)",
            reasoning: "Adding a specific target value will make this key result measurable"
          });
        }
        
        if (!kr.description || kr.description.length < 20) {
          keyResultSuggestions.push({
            title: kr.title,
            description: `Provide more context on how ${kr.title} will be measured and why it matters`,
            targetValue: kr.targetValue,
            reasoning: "A more detailed description helps clarify expectations and measurement approach"
          });
        }
      });
    }
    
    // Ensure we have at least one key result suggestion
    if (keyResultSuggestions.length === 0) {
      keyResultSuggestions.push({
        title: "Define 3-5 measurable metrics for tracking this objective",
        description: "Identify the most important metrics that will indicate success",
        reasoning: "Having concrete metrics is essential for measuring progress effectively"
      });
    }
    
    // Build main reasoning about the OKR quality
    const generalReasoning = keyResults.length === 0 
      ? "This objective needs key results to make it measurable and trackable."
      : "Consider making the key results more specific and ensuring they all have measurable targets.";
    
    return {
      originalObjective: objective,
      improvedTitle: titleSuggestion !== objective.title ? titleSuggestion : undefined,
      improvedDescription: descriptionSuggestion !== objective.description ? descriptionSuggestion : undefined,
      reasoning: `${titleReasoning} ${generalReasoning}`,
      keyResultSuggestions: keyResultSuggestions
    };
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
      log(`Error analyzing team alignment: ${errorMessage}. Using fallback analysis.`, "openai");
      
      // Return fallback alignment analysis
      return this.getFallbackTeamAlignment(teamObjectives, companyObjectives);
    }
  }
  
  /**
   * Provides fallback team alignment analysis when OpenAI API is unavailable
   */
  private getFallbackTeamAlignment(
    teamObjectives: Objective[],
    companyObjectives: Objective[]
  ): { 
    alignmentScore: number, 
    analysis: string,
    recommendations: string[] 
  } {
    // Start with a default alignment score
    let alignmentScore = 50; // Neutral starting point
    
    // Calculate a basic alignment score if we have data to work with
    if (teamObjectives.length > 0 && companyObjectives.length > 0) {
      // Keywords matching approach for basic alignment calculation
      const companyKeywords = this.extractKeywords(companyObjectives);
      const teamKeywords = this.extractKeywords(teamObjectives);
      
      // Calculate keyword overlap as a percentage
      const keywordMatches = companyKeywords.filter(word => 
        teamKeywords.some(teamWord => 
          teamWord.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(teamWord.toLowerCase())
        )
      ).length;
      
      if (companyKeywords.length > 0) {
        alignmentScore = Math.min(100, Math.max(20, Math.round((keywordMatches / companyKeywords.length) * 100)));
      }
    } else if (teamObjectives.length === 0) {
      alignmentScore = 0; // No team objectives means no alignment
    } else if (companyObjectives.length === 0) {
      alignmentScore = 50; // No company objectives to align with, so neutral score
    }
    
    // Build analysis text based on alignment score and objectives
    let analysis = "";
    if (teamObjectives.length === 0) {
      analysis = "The team currently has no defined objectives, which means there is no alignment with company objectives. Creating team objectives that support company goals should be a priority.";
    } else if (companyObjectives.length === 0) {
      analysis = "Company objectives have not been defined, making it impossible to analyze team alignment. Establishing clear company objectives is necessary for alignment analysis.";
    } else if (alignmentScore < 30) {
      analysis = "The team's objectives show limited alignment with company objectives. There appears to be a disconnect between team focus areas and overall company direction.";
    } else if (alignmentScore < 70) {
      analysis = "The team's objectives show moderate alignment with company objectives. Some areas are well-aligned, but there are opportunities to strengthen the connection between team activities and company goals.";
    } else {
      analysis = "The team's objectives show strong alignment with company objectives. The team is clearly focused on contributing to company-level outcomes.";
    }
    
    // Provide generic recommendations based on alignment score
    const recommendations: string[] = [];
    
    if (teamObjectives.length === 0) {
      recommendations.push("Create team objectives that directly support company goals");
      recommendations.push("Schedule an OKR planning session with team members");
      recommendations.push("Review company objectives with the team to ensure understanding");
    } else if (companyObjectives.length === 0) {
      recommendations.push("Work with leadership to establish clear company objectives");
      recommendations.push("Define how team objectives contribute to broader organizational success");
      recommendations.push("Review team objectives once company objectives are established");
    } else {
      if (alignmentScore < 50) {
        recommendations.push("Review and revise team objectives to better align with company priorities");
        recommendations.push("Create explicit connections between team objectives and company goals");
        recommendations.push("Schedule alignment sessions with leadership to ensure understanding of company direction");
      }
      
      recommendations.push("Include specific language from company objectives in team OKRs");
      recommendations.push("Establish regular check-ins to ensure continued alignment as objectives evolve");
      recommendations.push("Create a visual map connecting team objectives to company goals for better visibility");
    }
    
    return {
      alignmentScore,
      analysis,
      recommendations
    };
  }
  
  /**
   * Helper method to extract keywords from objectives for basic analysis
   */
  private extractKeywords(objectives: Objective[]): string[] {
    const stopWords = ["and", "the", "to", "of", "in", "for", "a", "an", "by", "with", "on", "our"];
    const allText = objectives.map(obj => `${obj.title} ${obj.description || ""}`).join(" ");
    
    // Split text into words, remove common stop words, and filter to words with 4+ characters
    return allText
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word.toLowerCase()))
      .map(word => word.replace(/[^\w]/g, ""))  // Remove non-word characters
      .filter(word => word.length > 0);  // Remove empty strings after cleanup
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