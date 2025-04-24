import { db } from "../db";
import { storage } from "../storage";
import { 
  users, teams, cadences, timeframes, objectives, keyResults, initiatives, checkIns,
  accessGroups, userAccessGroups, chatRooms, chatRoomMembers, messages
} from "../../shared/schema";
import { hashPassword } from "../auth";
import { eq } from "drizzle-orm";

async function clearAllData() {
  console.log("Clearing existing data...");
  
  // Delete in reverse order of dependencies
  await db.delete(messages);
  await db.delete(chatRoomMembers);
  await db.delete(chatRooms);
  await db.delete(userAccessGroups);
  await db.delete(checkIns);
  await db.delete(initiatives);
  await db.delete(keyResults);
  await db.delete(objectives);
  await db.delete(timeframes);
  await db.delete(cadences);
  await db.delete(accessGroups);
  
  // Keep existing users and teams
  // await db.delete(users);
  // await db.delete(teams);
  
  console.log("All tables cleared.");
}

async function seedUsers() {
  console.log("Seeding users...");
  
  // Check if admin user exists
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    await storage.createUser({
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@company.com",
      password: await hashPassword("admin123"),
      role: "admin",
      language: "en"
    });
    console.log("Created admin user");
  } else {
    console.log("Admin user already exists");
  }
  
  // Sample users
  const sampleUsers = [
    {
      username: "jsmith",
      firstName: "John",
      lastName: "Smith",
      email: "jsmith@company.com",
      password: await hashPassword("password123"),
      role: "manager",
      teamId: 1, // Marketing Team
      onboardingProgress: 100,
      language: "en"
    },
    {
      username: "agarcia",
      firstName: "Ana",
      lastName: "Garcia",
      email: "agarcia@company.com",
      password: await hashPassword("password123"),
      role: "manager",
      teamId: 2, // Product Team
      onboardingProgress: 100,
      language: "es"
    },
    {
      username: "lchen",
      firstName: "Li",
      lastName: "Chen",
      email: "lchen@company.com",
      password: await hashPassword("password123"),
      role: "manager",
      teamId: 3, // Sales Team
      onboardingProgress: 100,
      language: "zh"
    },
    {
      username: "mwilliams",
      firstName: "Michael",
      lastName: "Williams",
      email: "mwilliams@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 1,
      managerId: 1,
      onboardingProgress: 75,
      language: "en"
    },
    {
      username: "sjohnson",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sjohnson@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 1,
      managerId: 1,
      onboardingProgress: 90,
      language: "en"
    },
    {
      username: "rpatel",
      firstName: "Raj",
      lastName: "Patel",
      email: "rpatel@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 2,
      managerId: 2,
      onboardingProgress: 60,
      language: "en"
    },
    {
      username: "ykim",
      firstName: "Yuna",
      lastName: "Kim",
      email: "ykim@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 2,
      managerId: 2,
      onboardingProgress: 85,
      language: "ko"
    },
    {
      username: "dmiller",
      firstName: "David",
      lastName: "Miller",
      email: "dmiller@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 3,
      managerId: 3,
      onboardingProgress: 100,
      language: "en"
    },
    {
      username: "tanderson",
      firstName: "Tanya",
      lastName: "Anderson",
      email: "tanderson@company.com",
      password: await hashPassword("password123"),
      role: "user",
      teamId: 3,
      managerId: 3,
      onboardingProgress: 50,
      language: "en"
    }
  ];
  
  for (const user of sampleUsers) {
    const existingUser = await storage.getUserByUsername(user.username);
    if (!existingUser) {
      await storage.createUser(user);
      console.log(`Created user: ${user.firstName} ${user.lastName}`);
    } else {
      console.log(`User ${user.firstName} ${user.lastName} already exists`);
    }
  }
}

async function seedTeams() {
  console.log("Seeding teams...");
  
  const sampleTeams = [
    {
      name: "Marketing Team",
      description: "The marketing team is responsible for promoting the company's products and services.",
    },
    {
      name: "Product Team",
      description: "The product team is responsible for developing and managing the company's products.",
    },
    {
      name: "Sales Team",
      description: "The sales team is responsible for selling the company's products and services to customers.",
    },
    {
      name: "Engineering Team",
      description: "The engineering team is responsible for building and maintaining the company's technical infrastructure.",
      parentId: 2 // Under Product
    },
    {
      name: "Design Team",
      description: "The design team is responsible for the UI/UX design of the company's products.",
      parentId: 2 // Under Product
    },
    {
      name: "Customer Success Team",
      description: "The customer success team is responsible for ensuring customer satisfaction and retention.",
      parentId: 3 // Under Sales
    }
  ];
  
  for (const team of sampleTeams) {
    // Check if team already exists
    const existingTeams = await storage.getAllTeams();
    const teamExists = existingTeams.some(t => t.name === team.name);
    
    if (!teamExists) {
      await storage.createTeam(team);
      console.log(`Created team: ${team.name}`);
    } else {
      console.log(`Team ${team.name} already exists`);
    }
  }
}

async function seedCadencesAndTimeframes() {
  console.log("Seeding cadences and timeframes...");
  
  // Create cadences
  const cadenceData = [
    { name: "Annual", description: "Yearly planning cycle", period: "annual" },
    { name: "Quarterly", description: "Quarterly planning cycle", period: "quarterly" },
    { name: "Monthly", description: "Monthly planning cycle", period: "monthly" }
  ];
  
  const cadenceIds: Record<string, number> = {};
  
  for (const cadence of cadenceData) {
    // Check if cadence already exists
    const existingCadences = await storage.getAllCadences();
    const existingCadence = existingCadences.find(c => c.name === cadence.name);
    
    if (existingCadence) {
      cadenceIds[cadence.name] = existingCadence.id;
      console.log(`Cadence ${cadence.name} already exists`);
    } else {
      const newCadence = await storage.createCadence(cadence);
      cadenceIds[cadence.name] = newCadence.id;
      console.log(`Created cadence: ${cadence.name}`);
    }
  }
  
  // Create timeframes
  const currentYear = new Date().getFullYear();
  const timeframeData = [
    // Annual timeframes
    { 
      name: `${currentYear}`, 
      startDate: new Date(`${currentYear}-01-01`), 
      endDate: new Date(`${currentYear}-12-31`),
      cadenceId: cadenceIds["Annual"]
    },
    { 
      name: `${currentYear + 1}`, 
      startDate: new Date(`${currentYear + 1}-01-01`), 
      endDate: new Date(`${currentYear + 1}-12-31`),
      cadenceId: cadenceIds["Annual"]
    },
    
    // Quarterly timeframes for current year
    { 
      name: `Q1 ${currentYear}`, 
      startDate: new Date(`${currentYear}-01-01`), 
      endDate: new Date(`${currentYear}-03-31`),
      cadenceId: cadenceIds["Quarterly"]
    },
    { 
      name: `Q2 ${currentYear}`, 
      startDate: new Date(`${currentYear}-04-01`), 
      endDate: new Date(`${currentYear}-06-30`),
      cadenceId: cadenceIds["Quarterly"]
    },
    { 
      name: `Q3 ${currentYear}`, 
      startDate: new Date(`${currentYear}-07-01`), 
      endDate: new Date(`${currentYear}-09-30`),
      cadenceId: cadenceIds["Quarterly"]
    },
    { 
      name: `Q4 ${currentYear}`, 
      startDate: new Date(`${currentYear}-10-01`), 
      endDate: new Date(`${currentYear}-12-31`),
      cadenceId: cadenceIds["Quarterly"]
    },
    
    // Monthly timeframes for current quarter
    { 
      name: `January ${currentYear}`, 
      startDate: new Date(`${currentYear}-01-01`), 
      endDate: new Date(`${currentYear}-01-31`),
      cadenceId: cadenceIds["Monthly"]
    },
    { 
      name: `February ${currentYear}`, 
      startDate: new Date(`${currentYear}-02-01`), 
      endDate: new Date(`${currentYear}-02-28`),
      cadenceId: cadenceIds["Monthly"]
    },
    { 
      name: `March ${currentYear}`, 
      startDate: new Date(`${currentYear}-03-01`), 
      endDate: new Date(`${currentYear}-03-31`),
      cadenceId: cadenceIds["Monthly"]
    },
    { 
      name: `April ${currentYear}`, 
      startDate: new Date(`${currentYear}-04-01`), 
      endDate: new Date(`${currentYear}-04-30`),
      cadenceId: cadenceIds["Monthly"]
    },
    { 
      name: `May ${currentYear}`, 
      startDate: new Date(`${currentYear}-05-01`), 
      endDate: new Date(`${currentYear}-05-31`),
      cadenceId: cadenceIds["Monthly"]
    },
    { 
      name: `June ${currentYear}`, 
      startDate: new Date(`${currentYear}-06-01`), 
      endDate: new Date(`${currentYear}-06-30`),
      cadenceId: cadenceIds["Monthly"]
    }
  ];
  
  for (const timeframe of timeframeData) {
    // Check if timeframe already exists
    const existingTimeframes = await storage.getAllTimeframes();
    const timeframeExists = existingTimeframes.some(
      t => t.name === timeframe.name && t.cadenceId === timeframe.cadenceId
    );
    
    if (!timeframeExists) {
      await storage.createTimeframe(timeframe);
      console.log(`Created timeframe: ${timeframe.name}`);
    } else {
      console.log(`Timeframe ${timeframe.name} already exists`);
    }
  }
}

async function seedObjectivesAndKeyResults() {
  console.log("Seeding objectives and key results...");
  
  // Get all timeframes
  const timeframes = await storage.getAllTimeframes();
  const annualTimeframe = timeframes.find(t => t.name === `${new Date().getFullYear()}`);
  const q1Timeframe = timeframes.find(t => t.name === `Q1 ${new Date().getFullYear()}`);
  const q2Timeframe = timeframes.find(t => t.name === `Q2 ${new Date().getFullYear()}`);
  
  if (!annualTimeframe || !q1Timeframe || !q2Timeframe) {
    console.error("Required timeframes not found");
    return;
  }
  
  // Get team IDs
  const teams = await storage.getAllTeams();
  const marketingTeam = teams.find(t => t.name === "Marketing Team");
  const productTeam = teams.find(t => t.name === "Product Team");
  const salesTeam = teams.find(t => t.name === "Sales Team");
  
  if (!marketingTeam || !productTeam || !salesTeam) {
    console.error("Required teams not found");
    return;
  }
  
  // Get user IDs
  const users = await storage.getAllUsers();
  const marketingManager = users.find(u => u.username === "jsmith");
  const productManager = users.find(u => u.username === "agarcia");
  const salesManager = users.find(u => u.username === "lchen");
  
  if (!marketingManager || !productManager || !salesManager) {
    console.error("Required users not found");
    return;
  }
  
  // Create company-level objectives
  const companyObjectives = [
    {
      title: "Increase Annual Revenue",
      description: "Achieve a 20% increase in annual revenue compared to the previous year",
      level: "company",
      ownerId: 1, // Admin
      status: "in_progress",
      progress: 35,
      timeframeId: annualTimeframe.id,
    },
    {
      title: "Improve Customer Satisfaction",
      description: "Increase overall customer satisfaction score from 8.2 to 9.0",
      level: "company",
      ownerId: 1, // Admin
      status: "in_progress",
      progress: 42,
      timeframeId: annualTimeframe.id,
    },
    {
      title: "Launch New Product Line",
      description: "Successfully launch the new product line by end of Q3",
      level: "company",
      ownerId: 1, // Admin
      status: "in_progress",
      progress: 20,
      timeframeId: annualTimeframe.id,
    }
  ];
  
  const companyObjectiveIds: number[] = [];
  for (const objective of companyObjectives) {
    // Check if objective already exists with the same title and timeframe
    const existingObjectives = await storage.getAllObjectives();
    const objectiveExists = existingObjectives.some(
      o => o.title === objective.title && o.timeframeId === objective.timeframeId
    );
    
    if (!objectiveExists) {
      const newObjective = await storage.createObjective(objective);
      companyObjectiveIds.push(newObjective.id);
      console.log(`Created company objective: ${objective.title}`);
    } else {
      const existingObjective = existingObjectives.find(
        o => o.title === objective.title && o.timeframeId === objective.timeframeId
      );
      if (existingObjective) {
        companyObjectiveIds.push(existingObjective.id);
      }
      console.log(`Company objective ${objective.title} already exists`);
    }
  }
  
  // Create department-level objectives
  const departmentObjectives = [
    // Marketing team objectives (aligned with company objective 1)
    {
      title: "Increase Marketing Qualified Leads",
      description: "Generate 2,000 marketing qualified leads per month by end of Q2",
      level: "department",
      ownerId: marketingManager.id,
      teamId: marketingTeam.id,
      parentId: companyObjectiveIds[0],
      status: "in_progress",
      progress: 45,
      timeframeId: q2Timeframe.id,
    },
    // Product team objectives (aligned with company objective 3)
    {
      title: "Complete Product Development",
      description: "Complete all development sprints for the new product line by end of Q2",
      level: "department",
      ownerId: productManager.id,
      teamId: productTeam.id,
      parentId: companyObjectiveIds[2],
      status: "in_progress",
      progress: 30,
      timeframeId: q2Timeframe.id,
    },
    // Sales team objectives (aligned with company objective 1)
    {
      title: "Increase Sales Conversion Rate",
      description: "Improve sales conversion rate from 15% to 20% by end of Q2",
      level: "department",
      ownerId: salesManager.id,
      teamId: salesTeam.id,
      parentId: companyObjectiveIds[0],
      status: "in_progress",
      progress: 25,
      timeframeId: q2Timeframe.id,
    }
  ];
  
  const departmentObjectiveIds: number[] = [];
  for (const objective of departmentObjectives) {
    // Check if objective already exists with the same title and timeframe
    const existingObjectives = await storage.getObjectivesByTimeframe(objective.timeframeId);
    const objectiveExists = existingObjectives.some(
      o => o.title === objective.title && o.teamId === objective.teamId
    );
    
    if (!objectiveExists) {
      const newObjective = await storage.createObjective(objective);
      departmentObjectiveIds.push(newObjective.id);
      console.log(`Created department objective: ${objective.title}`);
    } else {
      const existingObjective = existingObjectives.find(
        o => o.title === objective.title && o.teamId === objective.teamId
      );
      if (existingObjective) {
        departmentObjectiveIds.push(existingObjective.id);
      }
      console.log(`Department objective ${objective.title} already exists`);
    }
  }
  
  // Create key results for company objectives
  const keyResultsData = [
    // Key results for "Increase Annual Revenue"
    {
      title: "Q1 Revenue Target",
      description: "Achieve $2.5M in Q1 revenue",
      objectiveId: companyObjectiveIds[0],
      startValue: "0",
      targetValue: "2500000",
      currentValue: "2350000",
      format: "currency",
      progress: 94,
    },
    {
      title: "Q2 Revenue Target",
      description: "Achieve $3M in Q2 revenue",
      objectiveId: companyObjectiveIds[0],
      startValue: "0",
      targetValue: "3000000",
      currentValue: "1800000",
      format: "currency",
      progress: 60,
    },
    {
      title: "New Enterprise Deals",
      description: "Close 15 new enterprise deals by end of year",
      objectiveId: companyObjectiveIds[0],
      startValue: "0",
      targetValue: "15",
      currentValue: "5",
      format: "number",
      progress: 33,
    },
    
    // Key results for "Improve Customer Satisfaction"
    {
      title: "Support Response Time",
      description: "Reduce average support response time to under 4 hours",
      objectiveId: companyObjectiveIds[1],
      startValue: "24",
      targetValue: "4",
      currentValue: "6.5",
      format: "hours",
      progress: 87,
    },
    {
      title: "NPS Score",
      description: "Increase Net Promoter Score from 35 to 50",
      objectiveId: companyObjectiveIds[1],
      startValue: "35",
      targetValue: "50",
      currentValue: "42",
      format: "number",
      progress: 47,
    },
    
    // Key results for "Launch New Product Line"
    {
      title: "Beta Program",
      description: "Enroll 500 customers in the beta program",
      objectiveId: companyObjectiveIds[2],
      startValue: "0",
      targetValue: "500",
      currentValue: "320",
      format: "number",
      progress: 64,
    },
    {
      title: "Feature Completion",
      description: "Complete 100% of planned features for initial release",
      objectiveId: companyObjectiveIds[2],
      startValue: "0",
      targetValue: "100",
      currentValue: "65",
      format: "percentage",
      progress: 65,
    },
    
    // Key results for Marketing Team objective
    {
      title: "Organic Lead Generation",
      description: "Generate 1,000 organic leads per month by end of Q2",
      objectiveId: departmentObjectiveIds[0],
      startValue: "400",
      targetValue: "1000",
      currentValue: "750",
      format: "number",
      progress: 58,
    },
    {
      title: "Content Marketing Performance",
      description: "Increase blog traffic by 50% by end of Q2",
      objectiveId: departmentObjectiveIds[0],
      startValue: "100",
      targetValue: "150",
      currentValue: "130",
      format: "percentage",
      progress: 60,
    },
    
    // Key results for Product Team objective
    {
      title: "Development Sprints Completion",
      description: "Complete all 8 development sprints by end of Q2",
      objectiveId: departmentObjectiveIds[1],
      startValue: "0",
      targetValue: "8",
      currentValue: "5",
      format: "number",
      progress: 63,
    },
    {
      title: "Quality Assurance",
      description: "Achieve 98% test coverage for all new code",
      objectiveId: departmentObjectiveIds[1],
      startValue: "80",
      targetValue: "98",
      currentValue: "92",
      format: "percentage",
      progress: 67,
    },
    
    // Key results for Sales Team objective
    {
      title: "Sales Training Completion",
      description: "Complete sales training for all team members",
      objectiveId: departmentObjectiveIds[2],
      startValue: "0",
      targetValue: "100",
      currentValue: "75",
      format: "percentage",
      progress: 75,
    },
    {
      title: "Sales Cycle Length",
      description: "Reduce average sales cycle from 45 days to 30 days",
      objectiveId: departmentObjectiveIds[2],
      startValue: "45",
      targetValue: "30",
      currentValue: "35",
      format: "days",
      progress: 67,
    }
  ];
  
  const keyResultIds: number[] = [];
  for (const kr of keyResultsData) {
    // Check if key result already exists with the same title and objective
    const existingKeyResults = await storage.getKeyResultsByObjective(kr.objectiveId);
    const keyResultExists = existingKeyResults.some(
      k => k.title === kr.title
    );
    
    if (!keyResultExists) {
      const newKeyResult = await storage.createKeyResult(kr);
      keyResultIds.push(newKeyResult.id);
      console.log(`Created key result: ${kr.title}`);
    } else {
      const existingKeyResult = existingKeyResults.find(
        k => k.title === kr.title
      );
      if (existingKeyResult) {
        keyResultIds.push(existingKeyResult.id);
      }
      console.log(`Key result ${kr.title} already exists`);
    }
  }
  
  // Create initiatives
  const initiativesData = [
    {
      title: "LinkedIn Advertising Campaign",
      description: "Run targeted ads on LinkedIn to generate B2B leads",
      owner: "Michael Williams",
      keyResultId: keyResultIds[7], // Organic Lead Generation
      status: "in_progress",
    },
    {
      title: "Content Calendar Development",
      description: "Create a comprehensive content calendar for Q2",
      owner: "Sarah Johnson",
      keyResultId: keyResultIds[8], // Content Marketing Performance
      status: "completed",
    },
    {
      title: "Development Sprint 6 Planning",
      description: "Plan and kickoff development sprint 6",
      owner: "Raj Patel",
      keyResultId: keyResultIds[9], // Development Sprints Completion
      status: "in_progress",
    },
    {
      title: "Test Automation Framework",
      description: "Implement automated testing framework for the new product",
      owner: "Yuna Kim",
      keyResultId: keyResultIds[10], // Quality Assurance
      status: "in_progress",
    },
    {
      title: "Sales Team Training Workshop",
      description: "Conduct a 2-day workshop on new sales methodologies",
      owner: "David Miller",
      keyResultId: keyResultIds[11], // Sales Training Completion
      status: "completed",
    },
    {
      title: "Sales Process Optimization",
      description: "Review and optimize the current sales process to reduce cycle time",
      owner: "Tanya Anderson",
      keyResultId: keyResultIds[12], // Sales Cycle Length
      status: "in_progress",
    }
  ];
  
  for (const initiative of initiativesData) {
    // Check if initiative already exists with the same title and key result
    const existingInitiatives = await storage.getInitiativesByKeyResult(initiative.keyResultId);
    const initiativeExists = existingInitiatives.some(
      i => i.title === initiative.title
    );
    
    if (!initiativeExists) {
      await storage.createInitiative(initiative);
      console.log(`Created initiative: ${initiative.title}`);
    } else {
      console.log(`Initiative ${initiative.title} already exists`);
    }
  }
}

async function seedCheckIns() {
  console.log("Seeding check-ins...");
  
  // Get all users
  const users = await storage.getAllUsers();
  
  // Get some key results and objectives
  const objectives = await storage.getAllObjectives();
  const keyResultsList = await db.select().from(keyResults).limit(10);
  
  if (objectives.length === 0 || keyResultsList.length === 0) {
    console.error("No objectives or key results found");
    return;
  }
  
  // Create check-ins
  const checkInsData = [
    {
      userId: users.find(u => u.username === "jsmith")?.id || 1,
      objectiveId: objectives[0].id,
      progress: 35,
      notes: "We're making steady progress on increasing revenue. Q1 targets were almost met, and Q2 is looking promising."
    },
    {
      userId: users.find(u => u.username === "agarcia")?.id || 2,
      objectiveId: objectives[2].id,
      progress: 20,
      notes: "Product development is on track, but we're facing some challenges with the supply chain."
    },
    {
      userId: users.find(u => u.username === "lchen")?.id || 3,
      keyResultId: keyResultsList[2]?.id || 3,
      progress: 67,
      notes: "We've implemented new sales processes that are starting to show results. Average cycle time is down to 35 days."
    },
    {
      userId: users.find(u => u.username === "mwilliams")?.id || 4,
      keyResultId: keyResultsList[1]?.id || 2,
      progress: 58,
      notes: "The LinkedIn campaign is performing well. We've generated 750 leads so far."
    },
    {
      userId: users.find(u => u.username === "rpatel")?.id || 6,
      keyResultId: keyResultsList[0]?.id || 1,
      progress: 63,
      notes: "We've completed 5 out of 8 development sprints. Sprint 6 is starting next week."
    }
  ];
  
  for (const checkIn of checkInsData) {
    await storage.createCheckIn(checkIn);
    console.log(`Created check-in from user ID ${checkIn.userId}`);
  }
}

async function seedAccessGroups() {
  console.log("Seeding access groups...");
  
  // Create access groups
  const accessGroupsData = [
    {
      name: "Leadership Team",
      description: "C-level executives and department heads",
      permissions: { admin: true, viewAll: true, editAll: true }
    },
    {
      name: "Management",
      description: "Team managers and project leads",
      permissions: { manageTeam: true, assignObjectives: true, viewDepartmentData: true }
    },
    {
      name: "Product Development",
      description: "Product managers, engineers, and designers",
      permissions: { viewProductData: true, updateProgress: true }
    },
    {
      name: "Marketing",
      description: "Marketing specialists and content creators",
      permissions: { viewMarketingData: true, updateProgress: true }
    },
    {
      name: "Sales",
      description: "Sales representatives and account managers",
      permissions: { viewSalesData: true, updateProgress: true }
    }
  ];
  
  const accessGroupIds: Record<string, number> = {};
  
  for (const group of accessGroupsData) {
    // Check if group already exists
    const existingGroups = await storage.getAllAccessGroups();
    const groupExists = existingGroups.some(g => g.name === group.name);
    
    if (!groupExists) {
      const newGroup = await storage.createAccessGroup(group);
      accessGroupIds[group.name] = newGroup.id;
      console.log(`Created access group: ${group.name}`);
    } else {
      const existingGroup = existingGroups.find(g => g.name === group.name);
      if (existingGroup) {
        accessGroupIds[group.name] = existingGroup.id;
      }
      console.log(`Access group ${group.name} already exists`);
    }
  }
  
  // Assign users to access groups
  const users = await storage.getAllUsers();
  
  // Leadership Team
  if (users.find(u => u.username === "admin")) {
    await storage.assignUserToAccessGroup(
      users.find(u => u.username === "admin")!.id,
      accessGroupIds["Leadership Team"]
    );
  }
  
  // Management
  const managers = users.filter(u => u.role === "manager");
  for (const manager of managers) {
    await storage.assignUserToAccessGroup(
      manager.id,
      accessGroupIds["Management"]
    );
    
    // Also assign to Leadership Team
    await storage.assignUserToAccessGroup(
      manager.id,
      accessGroupIds["Leadership Team"]
    );
  }
  
  // Product Development
  const productTeamUsers = users.filter(u => u.teamId === 2);
  for (const user of productTeamUsers) {
    await storage.assignUserToAccessGroup(
      user.id,
      accessGroupIds["Product Development"]
    );
  }
  
  // Marketing
  const marketingTeamUsers = users.filter(u => u.teamId === 1);
  for (const user of marketingTeamUsers) {
    await storage.assignUserToAccessGroup(
      user.id,
      accessGroupIds["Marketing"]
    );
  }
  
  // Sales
  const salesTeamUsers = users.filter(u => u.teamId === 3);
  for (const user of salesTeamUsers) {
    await storage.assignUserToAccessGroup(
      user.id,
      accessGroupIds["Sales"]
    );
  }
  
  console.log("Assigned users to access groups");
}

async function seedChatRooms() {
  console.log("Seeding chat rooms...");
  
  // Get all users
  const users = await storage.getAllUsers();
  
  // Create chat rooms
  const chatRoomsData = [
    {
      name: "Company Announcements",
      type: "channel",
      createdBy: users.find(u => u.username === "admin")?.id || 1,
      description: "Official company-wide announcements"
    },
    {
      name: "Leadership Discussion",
      type: "channel",
      createdBy: users.find(u => u.username === "admin")?.id || 1,
      description: "Discussion forum for leadership team"
    },
    {
      name: "Marketing Team",
      type: "channel",
      createdBy: users.find(u => u.username === "jsmith")?.id || 1,
      description: "Marketing team discussions"
    },
    {
      name: "Product Team",
      type: "channel",
      createdBy: users.find(u => u.username === "agarcia")?.id || 2,
      description: "Product team discussions"
    },
    {
      name: "Sales Team",
      type: "channel",
      createdBy: users.find(u => u.username === "lchen")?.id || 3,
      description: "Sales team discussions"
    },
    {
      name: "Q2 OKR Planning",
      type: "channel",
      createdBy: users.find(u => u.username === "admin")?.id || 1,
      description: "Planning OKRs for Q2"
    }
  ];
  
  const chatRoomIds: Record<string, number> = {};
  
  for (const room of chatRoomsData) {
    // Check if room already exists
    const existingRooms = await storage.getAllChatRooms();
    const roomExists = existingRooms.some(r => r.name === room.name);
    
    if (!roomExists) {
      const newRoom = await storage.createChatRoom(room);
      chatRoomIds[room.name] = newRoom.id;
      console.log(`Created chat room: ${room.name}`);
    } else {
      const existingRoom = existingRooms.find(r => r.name === room.name);
      if (existingRoom) {
        chatRoomIds[room.name] = existingRoom.id;
      }
      console.log(`Chat room ${room.name} already exists`);
    }
  }
  
  // Add users to chat rooms
  // Company Announcements - all users
  for (const user of users) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Company Announcements"],
      role: "member"
    });
  }
  
  // Leadership Discussion - only admin and managers
  const leadershipUsers = users.filter(u => u.role === "admin" || u.role === "manager");
  for (const user of leadershipUsers) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Leadership Discussion"],
      role: user.role === "admin" ? "admin" : "member"
    });
  }
  
  // Marketing Team - marketing team members
  const marketingTeamUsers = users.filter(u => u.teamId === 1);
  for (const user of marketingTeamUsers) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Marketing Team"],
      role: user.role === "manager" ? "admin" : "member"
    });
  }
  
  // Product Team - product team members
  const productTeamUsers = users.filter(u => u.teamId === 2);
  for (const user of productTeamUsers) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Product Team"],
      role: user.role === "manager" ? "admin" : "member"
    });
  }
  
  // Sales Team - sales team members
  const salesTeamUsers = users.filter(u => u.teamId === 3);
  for (const user of salesTeamUsers) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Sales Team"],
      role: user.role === "manager" ? "admin" : "member"
    });
  }
  
  // Q2 OKR Planning - all managers and admin
  const planningUsers = users.filter(u => u.role === "admin" || u.role === "manager");
  for (const user of planningUsers) {
    await storage.addUserToChatRoom({
      userId: user.id,
      chatRoomId: chatRoomIds["Q2 OKR Planning"],
      role: user.role === "admin" ? "admin" : "member"
    });
  }
  
  console.log("Added users to chat rooms");
  
  // Add messages to chat rooms
  const messagesData = [
    {
      userId: users.find(u => u.username === "admin")?.id || 1,
      chatRoomId: chatRoomIds["Company Announcements"],
      content: "Welcome to the Company Announcements channel! Important company-wide information will be shared here."
    },
    {
      userId: users.find(u => u.username === "admin")?.id || 1,
      chatRoomId: chatRoomIds["Company Announcements"],
      content: "Our Q1 results are in! We've achieved 94% of our revenue target for the quarter. Great job everyone!"
    },
    {
      userId: users.find(u => u.username === "admin")?.id || 1,
      chatRoomId: chatRoomIds["Leadership Discussion"],
      content: "Let's discuss our approach to Q2 planning. I'd like to get everyone's thoughts on our key focus areas."
    },
    {
      userId: users.find(u => u.username === "jsmith")?.id || 1,
      chatRoomId: chatRoomIds["Leadership Discussion"],
      content: "I think we should focus on improving customer retention. Our churn rate has been creeping up."
    },
    {
      userId: users.find(u => u.username === "agarcia")?.id || 2,
      chatRoomId: chatRoomIds["Leadership Discussion"],
      content: "The new product development is on track. We're planning to release the beta in Q2."
    },
    {
      userId: users.find(u => u.username === "jsmith")?.id || 1,
      chatRoomId: chatRoomIds["Marketing Team"],
      content: "Team, our new campaign is launching next week. Please review the creative assets by Friday."
    },
    {
      userId: users.find(u => u.username === "mwilliams")?.id || 4,
      chatRoomId: chatRoomIds["Marketing Team"],
      content: "I've uploaded the draft blog posts for review. Can someone give me feedback?"
    },
    {
      userId: users.find(u => u.username === "agarcia")?.id || 2,
      chatRoomId: chatRoomIds["Product Team"],
      content: "Sprint 6 planning is this Thursday. Please update your current tasks in the system."
    },
    {
      userId: users.find(u => u.username === "rpatel")?.id || 6,
      chatRoomId: chatRoomIds["Product Team"],
      content: "I've completed the API documentation. It's ready for review."
    },
    {
      userId: users.find(u => u.username === "lchen")?.id || 3,
      chatRoomId: chatRoomIds["Sales Team"],
      content: "Great news! We just closed the Johnson deal. It's our largest this quarter."
    },
    {
      userId: users.find(u => u.username === "dmiller")?.id || 8,
      chatRoomId: chatRoomIds["Sales Team"],
      content: "I'm meeting with Acme Corp next week. Does anyone have insights about their needs?"
    },
    {
      userId: users.find(u => u.username === "admin")?.id || 1,
      chatRoomId: chatRoomIds["Q2 OKR Planning"],
      content: "Let's use this channel to coordinate our Q2 OKR planning. We'll need to finalize objectives by the end of the month."
    },
    {
      userId: users.find(u => u.username === "jsmith")?.id || 1,
      chatRoomId: chatRoomIds["Q2 OKR Planning"],
      content: "The Marketing team is focusing on lead generation and brand awareness for Q2."
    },
    {
      userId: users.find(u => u.username === "agarcia")?.id || 2,
      chatRoomId: chatRoomIds["Q2 OKR Planning"],
      content: "Product team will prioritize the new feature release and improving our quality metrics."
    }
  ];
  
  for (const message of messagesData) {
    await storage.createMessage(message);
  }
  
  console.log("Added messages to chat rooms");
}

async function seedAll() {
  try {
    // Clear existing data except users and teams
    await clearAllData();
    
    // Seed basic data
    await seedTeams();
    await seedUsers();
    await seedCadencesAndTimeframes();
    
    // Seed OKR data
    await seedObjectivesAndKeyResults();
    await seedCheckIns();
    
    // Seed collaboration data
    await seedAccessGroups();
    await seedChatRooms();
    
    console.log("All data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

// Export the seed function
export { seedAll };