
import { IdeaCategoryEnum, Question, Response } from './types';

export const GENERAL_QUESTIONS_ORDERED: Question[] = [
  { 
    id: 'G0', 
    stage: 1, 
    theme: "Idea Title", 
    text: "Let's start with a working title for your idea. What would you call it?",
    isMandatory: true,
  },
  { 
    id: 'G1', 
    stage: 1, 
    theme: "Core Idea & Problem", 
    text: "What is the core of your idea? Describe the main concept. What specific problem does it solve or what opportunity does it primarily address?",
    isMandatory: true,
  },
  { 
    id: 'G2', 
    stage: 1, 
    theme: "Target Users/Beneficiaries", 
    text: "Who are the primary target users, customers, or beneficiaries of this idea? Be as specific as possible." 
  },
  { 
    id: 'G3', 
    stage: 1, 
    theme: "Current State & Differentiation", 
    text: "How is this problem currently being addressed (if at all)? What makes your idea different or better than existing solutions or approaches?" 
  },
  { 
    id: 'G4', 
    stage: 1, 
    theme: "Key Features/Components", 
    text: "What are the key features, components, or main activities involved in your idea?" 
  },
  { 
    id: 'G5', 
    stage: 2, 
    theme: "Potential Impact & Value", 
    text: "What is the potential impact or value proposition of your idea? (e.g., financial, social, operational efficiency)" 
  },
  { 
    id: 'G6', 
    stage: 2, 
    theme: "Success Metrics", 
    text: "How would you measure the success of this idea if it were implemented? What are key metrics?" 
  },
  { 
    id: 'G7', 
    stage: 2, 
    theme: "Risks & Challenges", 
    text: "What are the main risks, challenges, or obstacles you foresee in developing or implementing this idea?" 
  },
  { 
    id: 'G8', 
    stage: 2, 
    theme: "Competitive Landscape", 
    text: "Who are the main competitors or alternatives, if any? How does your idea stand out?" 
  },
  { 
    id: 'G9', 
    stage: 3, 
    theme: "Essential Resources", 
    text: "What key resources (e.g., skills, technology, funding, partnerships) would be essential to bring this idea to life?" 
  },
  { 
    id: 'G10', 
    stage: 3, 
    theme: "First Steps & Development", 
    text: "What would be the very first practical steps to start developing this idea?" 
  },
  { 
    id: 'G11', 
    stage: 3, 
    theme: "Pilot/Prototype/Experiment Plan", 
    text: "How could you test this idea on a small scale? Describe a potential pilot, prototype, or experiment." 
  },
  { 
    id: 'G12', 
    stage: 3, 
    theme: "Initial Success Outcome (Pilot)", 
    text: "What would a successful outcome look like for the pilot/prototype/experiment you described?" 
  },
];

export const CATEGORY_SPECIFIC_QUESTIONS: Partial<Record<IdeaCategoryEnum, Question[]>> = {
  [IdeaCategoryEnum.PRODUCT_INNOVATION]: [
    { id: 'P1', stage: 1, category: IdeaCategoryEnum.PRODUCT_INNOVATION, theme: "Product Specifics", text: "Describe the unique functionalities, design elements, or technological advancements of the proposed product." },
    { id: 'P2', stage: 2, category: IdeaCategoryEnum.PRODUCT_INNOVATION, theme: "Product Market & Strategy", text: "Who is the target market segment for this product? What is your go-to-market strategy?" },
    { id: 'P3', stage: 3, category: IdeaCategoryEnum.PRODUCT_INNOVATION, theme: "Product MVP & Adoption", text: "What features would constitute a Minimum Viable Product (MVP)? How do you plan to drive initial user adoption?" },
  ],
  [IdeaCategoryEnum.SERVICE_INNOVATION]: [
    { id: 'Srv1', stage: 1, category: IdeaCategoryEnum.SERVICE_INNOVATION, theme: "Service Design", text: "Outline the key aspects of the new service. How will it be delivered and experienced by users?" },
    { id: 'Srv2', stage: 2, category: IdeaCategoryEnum.SERVICE_INNOVATION, theme: "Service Value & Differentiation", text: "What unique value does this service offer compared to existing services? How will it improve customer satisfaction or create new market opportunities?" },
    { id: 'Srv3', stage: 3, category: IdeaCategoryEnum.SERVICE_INNOVATION, theme: "Service Pilot & Scalability", text: "How would you pilot this service? What are the considerations for scaling the service if successful?" },
  ],
  [IdeaCategoryEnum.PROCESS_INNOVATION]: [
    { id: 'Prc1', stage: 1, category: IdeaCategoryEnum.PROCESS_INNOVATION, theme: "Process Description & Ideal State", text: "Describe the new or improved process. What are the key changes from the current state, and what is the ideal future state?" },
    { id: 'Prc2', stage: 2, category: IdeaCategoryEnum.PROCESS_INNOVATION, theme: "Process Benefits & Impact", text: "What are the expected benefits (e.g., cost savings, time reduction, quality improvement)? How will these be measured?" },
    { id: 'Prc3', stage: 3, category: IdeaCategoryEnum.PROCESS_INNOVATION, theme: "Process Improvement Tools & Measurement", text: "What tools, methodologies, or technologies could be used for this process improvement? How will ongoing performance be measured?" },
  ],
  [IdeaCategoryEnum.BUSINESS_MODEL_INNOVATION]: [
    { id: 'BM1', stage: 1, category: IdeaCategoryEnum.BUSINESS_MODEL_INNOVATION, theme: "Business Model Novelty", text: "Describe the novel aspects of your proposed business model. How does it differ from traditional models in your industry or area?" },
    { id: 'BM2', stage: 2, category: IdeaCategoryEnum.BUSINESS_MODEL_INNOVATION, theme: "Business Model Strategic Rationale", text: "What is the strategic rationale behind this new business model? How does it create or capture value in a new way?" },
    { id: 'BM3', stage: 3, category: IdeaCategoryEnum.BUSINESS_MODEL_INNOVATION, theme: "Business Model Validation", text: "How can the key assumptions of this new business model be tested and validated quickly and efficiently?" },
  ],
  [IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION]: [
    { id: 'Tch1', stage: 1, category: IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION, theme: "Technology & Application", text: "Describe the core technology involved. Is it new, an adaptation, or a novel application of existing tech? What is its primary application in your idea?" },
    { id: 'Tch2', stage: 2, category: IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION, theme: "Technology Impact & Risks", text: "What is the potential impact of this technology? What are the key technical challenges, risks, or dependencies? (Consider TRL if applicable)." },
    { id: 'Tch3', stage: 3, category: IdeaCategoryEnum.TECHNOLOGICAL_INNOVATION, theme: "Technology Development & IP", text: "Outline the R&D plan for this technology. Are there any intellectual property considerations (e.g., patents, open source, licensing)?" },
  ],
  [IdeaCategoryEnum.MARKETING_INNOVATION]: [
    { id: 'Mkt1', stage: 1, category: IdeaCategoryEnum.MARKETING_INNOVATION, theme: "Marketing Initiative & Audience", text: "Describe the innovative marketing initiative or campaign. Who is the specific target audience for this marketing approach?" },
    { id: 'Mkt2', stage: 2, category: IdeaCategoryEnum.MARKETING_INNOVATION, theme: "Marketing Outcomes & Alignment", text: "What are the desired outcomes of this marketing innovation (e.g., brand awareness, lead generation, customer engagement)? How does it align with overall business strategy?" },
    { id: 'Mkt3', stage: 3, category: IdeaCategoryEnum.MARKETING_INNOVATION, theme: "Marketing Pilot & Metrics", text: "How could this marketing initiative be piloted? What key metrics will be used to measure its success and ROI?" },
  ],
  [IdeaCategoryEnum.CUSTOMER_EXPERIENCE_INNOVATION]: [
    { id: 'CX1', stage: 1, category: IdeaCategoryEnum.CUSTOMER_EXPERIENCE_INNOVATION, theme: "Customer Journey & Enhancement", text: "Identify the specific part of the customer journey this idea enhances. How does it improve the customer experience?" },
    { id: 'CX2', stage: 2, category: IdeaCategoryEnum.CUSTOMER_EXPERIENCE_INNOVATION, theme: "Customer Impact & Brand Alignment", text: "What is the anticipated impact on customer satisfaction, loyalty, or perception? How does this align with your brand values?" },
    { id: 'CX3', stage: 3, category: IdeaCategoryEnum.CUSTOMER_EXPERIENCE_INNOVATION, theme: "Customer Experience Implementation", text: "How will this CX improvement be implemented? What touchpoints, channels, or technologies are involved?" },
  ],
  [IdeaCategoryEnum.SUSTAINABILITY_INNOVATION]: [
    { id: 'Sus1', stage: 1, category: IdeaCategoryEnum.SUSTAINABILITY_INNOVATION, theme: "Sustainability Contribution & Scope", text: "How does this idea contribute to specific sustainability goals (e.g., environmental, social, governance - ESG)? Define its scope and boundaries." },
    { id: 'Sus2', stage: 2, category: IdeaCategoryEnum.SUSTAINABILITY_INNOVATION, theme: "Sustainability Benefits & Regulations", text: "What are the measurable sustainability benefits (e.g., carbon reduction, waste diversion, community impact)? Are there relevant regulations or standards?" },
    { id: 'Sus3', stage: 3, category: IdeaCategoryEnum.SUSTAINABILITY_INNOVATION, theme: "Sustainability Implementation & Reporting", text: "How will the sustainability aspects be implemented and monitored? How will impact be measured and reported (e.g., GRI, SDGs)?" },
  ],
  [IdeaCategoryEnum.SOCIAL_INNOVATION]: [
    { id: 'Soc1', stage: 1, category: IdeaCategoryEnum.SOCIAL_INNOVATION, theme: "Social Challenge & Beneficiaries", text: "What specific social challenge or unmet need does this idea address? Who are the primary beneficiaries within the community or society?" },
    { id: 'Soc2', stage: 2, category: IdeaCategoryEnum.SOCIAL_INNOVATION, theme: "Social Impact & Alignment", text: "Describe the desired social impact. How does this align with broader social goals or organizational mission? How will impact be measured qualitatively and quantitatively?" },
    { id: 'Soc3', stage: 3, category: IdeaCategoryEnum.SOCIAL_INNOVATION, theme: "Social Implementation & Sustainability", text: "How will this social innovation be implemented and sustained? What partnerships or community engagement strategies are needed?" },
  ],
  [IdeaCategoryEnum.REGULATORY_COMPLIANCE_INNOVATION]: [
    { id: 'Reg1', stage: 1, category: IdeaCategoryEnum.REGULATORY_COMPLIANCE_INNOVATION, theme: "Regulation & Current Process", text: "Which specific regulation, policy, or compliance requirement does this idea address? Describe the current process for managing this." },
    { id: 'Reg2', stage: 2, category: IdeaCategoryEnum.REGULATORY_COMPLIANCE_INNOVATION, theme: "Compliance Impact & Benefits", text: "How will this idea improve compliance, reduce risk, or enhance efficiency related to the regulation? What are the benefits?" },
    { id: 'Reg3', stage: 3, category: IdeaCategoryEnum.REGULATORY_COMPLIANCE_INNOVATION, theme: "Compliance Solution & Verification", text: "Describe the proposed solution or innovative approach to meet compliance. How will its effectiveness be verified and documented?" },
  ],
  [IdeaCategoryEnum.EMPLOYEE_EXPERIENCE_INNOVATION]: [
    { id: 'EE1', stage: 1, category: IdeaCategoryEnum.EMPLOYEE_EXPERIENCE_INNOVATION, theme: "Employee Aspect & Challenge", text: "What specific aspect of the employee experience (e.g., onboarding, development, well-being, tools) does this idea target? What is the current challenge or opportunity?" },
    { id: 'EE2', stage: 2, category: IdeaCategoryEnum.EMPLOYEE_EXPERIENCE_INNOVATION, theme: "Employee Impact & Culture", text: "How will this idea positively impact employees (e.g., engagement, productivity, retention)? How does it align with or enhance company culture?" },
    { id: 'EE3', stage: 3, category: IdeaCategoryEnum.EMPLOYEE_EXPERIENCE_INNOVATION, theme: "Employee Initiative Implementation", text: "How will this employee-focused initiative be implemented? What resources, communication, and change management steps are needed?" },
  ],
  [IdeaCategoryEnum.TRANSFORMATIONAL_INNOVATION]: [
    { id: 'Trn1', stage: 1, category: IdeaCategoryEnum.TRANSFORMATIONAL_INNOVATION, theme: "Transformational Nature", text: "In what way is this idea transformational or disruptive? Does it create a new market, fundamentally change an existing one, or offer a radical new solution (Horizon 3)?" },
    { id: 'Trn2', stage: 2, category: IdeaCategoryEnum.TRANSFORMATIONAL_INNOVATION, theme: "Transformational Opportunity & Uncertainty", text: "What is the scale of the opportunity if this idea succeeds? What are the major uncertainties and assumptions associated with this type of innovation?" },
    { id: 'Trn3', stage: 3, category: IdeaCategoryEnum.TRANSFORMATIONAL_INNOVATION, theme: "Transformational De-risking", text: "How can the high uncertainty of this transformational idea be managed or de-risked through experimentation, phased approaches, or strategic partnerships?" },
  ]
};

// Helper to get all questions for selected categories, ordered by stage, then general, then category-specific
export const getOrderedQuestionSet = (selectedCategories: IdeaCategoryEnum[]): Question[] => {
  const questions: Question[] = [];
  const stages: (1 | 2 | 3)[] = [1, 2, 3];

  stages.forEach(stage => {
    // Add general questions for the stage
    questions.push(...GENERAL_QUESTIONS_ORDERED.filter(q => q.stage === stage));

    // Add category-specific questions for the stage
    // Ensure primary category's questions (if one is designated first) could be prioritized if needed,
    // for now, iterating through selectedCategories is fine.
    selectedCategories.forEach(category => {
      const specificQs = CATEGORY_SPECIFIC_QUESTIONS[category];
      if (specificQs) {
        questions.push(...specificQs.filter(q => q.stage === stage));
      }
    });
  });
  return questions;
};

// Helper to synthesize title and description from answers
export const synthesizeTitleDescriptionFromAnswers = (answers: Response[]): { title: string, description: string } => {
    const titleAnswer = answers.find(a => a.question_id === 'G0');
    const descriptionAnswer = answers.find(a => a.question_id === 'G1');
    
    let title = titleAnswer ? (titleAnswer.response_text || '') : "Untitled Idea";
    let description = descriptionAnswer ? (descriptionAnswer.response_text || '') : "No detailed description provided.";

    // Fallback: if G1 is empty or too short, concatenate other answers for description
    if ((!descriptionAnswer || (descriptionAnswer.response_text ?? '').trim().length < 20) && answers.length > 1) {
        description = answers
            .filter(a => a.question_id !== 'G0' && (a.response_text ?? '').trim().length > 0)
            .map(a => {
                const questionText = GENERAL_QUESTIONS_ORDERED.find(q => q.id === a.question_id)?.theme ||
                                   Object.values(CATEGORY_SPECIFIC_QUESTIONS).flat().find(q => q.id === a.question_id)?.theme ||
                                   a.question_id;
                return `${questionText}: ${a.response_text}`;
            })
            .join('\n\n');
        if (description.trim().length === 0) description = "No detailed description provided.";
    }
    
    return { title: title.substring(0,255), description };
};
