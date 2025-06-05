
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircleIcon, SparklesIcon, CheckCircleIcon, UserCircleIcon, LogoutIcon, LightBulbIcon } from './components/icons';
import { 
    Idea, IdeaStatusEnum, IdeaCategoryEnum, IdeaTag, 
    WorkflowStage, CurrentQuestionnaireIdea,
    MeterScores
} from './types';
import { UserRole } from './lib/supabase';
import { AuthenticatedUser } from './AuthContext';
import { categorizeIdeaWithGemini } from './services/geminiService';
import { getOrderedQuestionSet, synthesizeTitleDescriptionFromAnswers } from './questions';
import CategorySelector from './components/CategorySelector';
import Questionnaire from './components/Questionnaire';
import IdeaList from './components/IdeaList';
import { TopMetersDisplay } from './components/Meters';
import LoginPage from './LoginPage';
import ReviewerDashboard from './ReviewerDashboard';
import { useAuth } from './AuthContext';

const App: React.FC = () => {
  const { currentUser, logout, isLoading: authIsLoading } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowStage>('idle');
  const [currentQuestionnaireIdea, setCurrentQuestionnaireIdea] = useState<CurrentQuestionnaireIdea | null>(null);
  const [isSubmittingAIIdea, setIsSubmittingAIIdea] = useState(false); 
  const [meterScores, setMeterScores] = useState<MeterScores>({ clarity: 0, value: 0, readiness: 0 });
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  useEffect(() => {
    if (!currentUser && !authIsLoading) {
      setWorkflowState('login');
    } else if (currentUser && workflowState === 'login') {
      setWorkflowState('idle');
    }
  }, [currentUser, authIsLoading, workflowState]);

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait for authentication to resolve
    }
    if (!currentUser) {
      setIdeas([]); // No user logged in, or session ended.
      return;
    }
    // currentUser is available and auth is resolved
    const storageKey = `ideas_${currentUser.id}`;
    const storedIdeas = localStorage.getItem(storageKey);
    if (storedIdeas) {
      try {
        const parsedIdeas: Idea[] = JSON.parse(storedIdeas).map((idea: any) => ({
          ...idea,
          created_at: new Date(idea.created_at),
          updated_at: new Date(idea.updated_at),
          chatHistory: Array.isArray(idea.chatHistory) ? idea.chatHistory.map((msg: any) => ({...msg, timestamp: new Date(msg.timestamp)})) : [],
          questionnaireAnswers: Array.isArray(idea.questionnaireAnswers) ? idea.questionnaireAnswers.map((ans: any) => ({...ans, responded_at: new Date(ans.responded_at)})) : [],
          clarityScore: typeof idea.clarityScore === 'number' ? idea.clarityScore : 0,
          valueScore: typeof idea.valueScore === 'number' ? idea.valueScore : 0,
          readinessScore: typeof idea.readinessScore === 'number' ? idea.readinessScore : 0,
          valueSelections: Array.isArray(idea.valueSelections) ? idea.valueSelections : [],
          effortSelection: idea.effortSelection || null,
          roiIndex: typeof idea.roiIndex === 'number' ? idea.roiIndex : undefined,
        }));
        setIdeas(parsedIdeas);
      } catch (e) {
        console.error("Failed to parse ideas from localStorage", e);
        setIdeas([]);
      }
    } else {
      setIdeas([]); // Initialize if nothing stored for this user
    }
  }, [currentUser, authIsLoading]);

  useEffect(() => {
    if (authIsLoading) {
      return; // Wait for authentication to resolve
    }
    if (!currentUser) {
      return; // No user, nothing to save
    }
    
    const storageKey = `ideas_${currentUser.id}`;
    const ideasExistInStorage = localStorage.getItem(storageKey) !== null;

    if (ideas.length === 0 && !ideasExistInStorage) {
      // Don't save an empty array on initial load if nothing was previously stored for this user.
      return;
    }
    // Save if ideas array is non-empty, OR if it's empty but ideas were previously stored (i.e., user deleted all their ideas).
    localStorage.setItem(storageKey, JSON.stringify(ideas));
  }, [ideas, currentUser, authIsLoading]);

  useEffect(() => {
    if (currentQuestionnaireIdea) {
      const newClarity = currentQuestionnaireIdea.clarityScore;
      const newValue = 0;
      const newReadiness = Math.min(newClarity, newValue);
      setMeterScores({
        clarity: newClarity,
        value: newValue, 
        readiness: newReadiness, 
      });
    } else if (workflowState === 'idle' || workflowState === 'reviewerDashboard' || workflowState === 'login') {
        setMeterScores({ clarity: 0, value: 0, readiness: 0 });
    }
  }, [currentQuestionnaireIdea, workflowState]);


  const startNewIdeaProcess = () => {
    if (!currentUser) { setWorkflowState('login'); return; }
    setMeterScores({ clarity: 0, value: 0, readiness: 0 });
    setWorkflowState('categorySelection');
  };

  const handleCategoriesSelected = (selectedCategories: IdeaCategoryEnum[]) => {
    if (!currentUser) { setWorkflowState('login'); return; }
    if (selectedCategories.length === 0) {
        alert("Please select at least one category to proceed.");
        return;
    }
    const newIdeaId = uuidv4();
    const questionSet = getOrderedQuestionSet(selectedCategories);
    
    setCurrentQuestionnaireIdea({
      id: newIdeaId,
      submitterEmail: currentUser.email,
      organisationId: currentUser.organisationId,
      selectedCategories: selectedCategories,
      answers: [], 
      currentQuestionSet: questionSet,
      currentSystemQuestionIndex: 0, 
      chatHistory: [], 
      interactionState: 'AI_INITIATING', 
      status: IdeaStatusEnum.IN_QUESTIONNAIRE_CHAT,
      createdAt: new Date(),
      clarityScore: 0,
      valueSelections: [],
      effortSelection: null,
    });
    setWorkflowState('questionnaireChat');
  };

  const handleQuestionnaireUpdate = (updatedIdea: CurrentQuestionnaireIdea) => {
    setCurrentQuestionnaireIdea(updatedIdea);
  };

  const handleValueEffortSubmit = async (finalizedIdeaData: CurrentQuestionnaireIdea) => {
    if (!currentUser) { setWorkflowState('login'); return; }
    setWorkflowState('submitting');
    setIsSubmittingAIIdea(true);
    setCurrentQuestionnaireIdea(finalizedIdeaData); 

    const { title, description } = synthesizeTitleDescriptionFromAnswers(finalizedIdeaData.answers);

    const newIdeaForList: Idea = {
      id: finalizedIdeaData.id,
      title: title || "Idea (Title Pending)",
      description: description || "Detailed in chat & value assessment.",
      submitterEmail: currentUser.email,
      organisationId: currentUser.organisationId,
      status: IdeaStatusEnum.PENDING_REVIEW, // Changed from UNDER_SCREENING
      tags: [],
      created_at: finalizedIdeaData.createdAt,
      updated_at: new Date(),
      selectedCategories: finalizedIdeaData.selectedCategories,
      questionnaireAnswers: finalizedIdeaData.answers,
      chatHistory: finalizedIdeaData.chatHistory,
      clarityScore: finalizedIdeaData.clarityScore,
      valueSelections: finalizedIdeaData.valueSelections,
      effortSelection: finalizedIdeaData.effortSelection,
      roiIndex: finalizedIdeaData.roiIndex,
      valueScore: meterScores.value, 
      readinessScore: meterScores.readiness, 
      category_suggestion_loading: true,
    };

    setIdeas(prevIdeas => [newIdeaForList, ...prevIdeas]);
    
    try {
      const categorizationResult = await categorizeIdeaWithGemini(title, description);
      let updatedTags: IdeaTag[] = [];
      let finalCategoryError: string | undefined = undefined;

      if (categorizationResult) {
        if (categorizationResult.error) {
          finalCategoryError = categorizationResult.error;
        }
        if (categorizationResult.category !== IdeaCategoryEnum.UNCATEGORIZED) {
           updatedTags.push({
            id: uuidv4(),
            category: categorizationResult.category,
            source: 'ai_categorization',
            confidence: categorizationResult.confidence,
            is_primary: true,
          });
        } else if (!categorizationResult.error) {
            finalCategoryError = "AI could not determine a specific category.";
        }
      } else { 
         finalCategoryError = "AI categorization service is unavailable.";
      }
      
      finalizedIdeaData.selectedCategories.forEach(userCat => {
        if (!updatedTags.some(tag => tag.category === userCat && tag.source === 'ai_categorization')) {
            updatedTags.push({
                id: uuidv4(),
                category: userCat,
                source: 'user_selection',
                is_primary: updatedTags.length === 0,
            });
        }
      });
      if (updatedTags.length > 0 && !updatedTags.some(tag => tag.is_primary)) {
        updatedTags[0].is_primary = true;
      }
      
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === newIdeaForList.id
            ? { ...idea, tags: updatedTags, category_suggestion_loading: false, category_suggestion_error: finalCategoryError, status: IdeaStatusEnum.PENDING_REVIEW } // Ensure it stays PENDING_REVIEW
            : idea
        )
      );

    } catch (error) {
      console.error("Error in AI categorization process:", error);
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === newIdeaForList.id
            ? { ...idea, category_suggestion_loading: false, category_suggestion_error: "An unexpected error occurred during AI categorization.", status: IdeaStatusEnum.PENDING_REVIEW }
            : idea
        )
      );
    } finally {
      setIsSubmittingAIIdea(false);
      setWorkflowState('submitted'); 
      setTimeout(() => {
        setWorkflowState('idle');
        setCurrentQuestionnaireIdea(null);
      }, 3000); 
    }
  };

  const handleQuestionnaireComplete = (finalizedChatData: CurrentQuestionnaireIdea) => {
    setCurrentQuestionnaireIdea({
      ...finalizedChatData,
      status: IdeaStatusEnum.IN_VALUE_DEFINITION,
    });
    setWorkflowState('valueDefinition');
  };
  
  const handleCancelQuestionnaire = () => {
    setCurrentQuestionnaireIdea(null);
    setWorkflowState('idle');
    setMeterScores({ clarity: 0, value: 0, readiness: 0 });
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      alert("You are not authorized to delete ideas.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this idea? This action cannot be undone.")) {
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
    }
  };

  const handleUpdateIdeaStatus = (ideaId: string, newStatus: IdeaStatusEnum) => {
     if (currentUser?.role !== UserRole.EVALUATOR && currentUser?.role !== UserRole.ADMIN) {
      alert("You are not authorized to change idea status.");
      return;
    }
    setIdeas(prevIdeas => prevIdeas.map(idea => 
      idea.id === ideaId ? { ...idea, status: newStatus, updated_at: new Date() } : idea
    ));
  };

  const navigateToDashboard = () => setWorkflowState('reviewerDashboard');
  const navigateToSubmitIdea = () => {
    setWorkflowState('idle'); // Will trigger startNewIdeaProcess if button clicked
    startNewIdeaProcess();
  }
  const navigateToHome = () => setWorkflowState('idle');

  const renderWorkflowContent = () => {
    if (authIsLoading) {
      return <div className="text-center py-10 text-white">Loading authentication...</div>;
    }
    
    // If no user is logged in, show login page
    if (!currentUser && workflowState === 'idle') {
      return <LoginPage />;
    }

    switch (workflowState) {
      case 'login':
        return <LoginPage />;
      case 'categorySelection':
        return <CategorySelector onSubmit={handleCategoriesSelected} onCancel={handleCancelQuestionnaire} />;
      case 'questionnaireChat':
        if (currentQuestionnaireIdea) {
          return (
            <Questionnaire
              ideaData={currentQuestionnaireIdea}
              onUpdate={handleQuestionnaireUpdate}
              onComplete={handleQuestionnaireComplete}
              onCancel={handleCancelQuestionnaire}
            />
          );
        }
        setWorkflowState('idle'); 
        return null;
      case 'valueDefinition':
        if (currentQuestionnaireIdea) {
             return (
                <div className="text-center py-10 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
                    <LightBulbIcon className="w-16 h-16 text-primary mx-auto mb-4" /> 
                    <h2 className="text-2xl font-bold uppercase text-neutral-darker mb-3">Define Value & Effort</h2>
                    <p className="text-neutral-dark font-body-medium mb-4">This section is coming soon! Here you'll define the potential value and effort for your idea.</p>
                    <p className="text-sm text-neutral-DEFAULT mb-6">Clarity Score: {Math.round(currentQuestionnaireIdea.clarityScore)}%</p>
                    <button 
                        onClick={() => handleValueEffortSubmit(currentQuestionnaireIdea)}
                        className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 btn-rounded transition-colors duration-150"
                    >
                        Proceed to Submit (Mock)
                    </button>
                     <button 
                        onClick={() => {
                            setWorkflowState('questionnaireChat'); 
                             setCurrentQuestionnaireIdea(prev => prev ? {...prev, interactionState: 'AWAITING_USER_RESPONSE'} : null);
                        }}
                        className="ml-4 text-neutral-dark hover:text-neutral-darker font-semibold py-2.5 px-6 btn-rounded border border-neutral-DEFAULT hover:border-neutral-dark transition-colors duration-150"
                    >
                        Back to Chat
                    </button>
                </div>
            );
        }
        setWorkflowState('idle');
        return null;
      case 'submitting':
        return (
          <div className="text-center py-10 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <SparklesIcon className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold uppercase text-neutral-darker mb-2">Finalizing Your Idea...</h2>
            <p className="text-neutral-dark font-body-medium">Our AI is analyzing and categorizing your submission. Please wait a moment.</p>
          </div>
        );
       case 'submitted':
        return (
          <div className="text-center py-10 bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <LightBulbIcon className="w-16 h-16 text-highlight mx-auto mb-4" />
            <h2 className="text-2xl font-bold uppercase text-highlight-dark mb-2">Idea Submitted Successfully!</h2>
            <p className="text-neutral-dark font-body-medium">Your idea has been added to the hub and is pending review. You will be redirected shortly.</p>
          </div>
        );
      case 'reviewerDashboard':
        if (currentUser && (currentUser.role === UserRole.EVALUATOR || currentUser.role === UserRole.ADMIN)) {
          // For Evaluators/Admins, show all ideas (mock for org filtering)
          return <ReviewerDashboard 
                    ideas={ideas} 
                    currentUser={currentUser}
                    onUpdateStatus={handleUpdateIdeaStatus}
                    onDeleteIdea={handleDeleteIdea}
                 />;
        }
        setWorkflowState('idle'); // Fallback if not authorized
        return null;
      case 'idle':
      default:
        if (!currentUser) return <LoginPage />; // Should be caught by top-level isLoading/currentUser check
        // Filter ideas: Contributors see their own, Evaluators/Admins see all
        const displayedIdeas = currentUser.role === UserRole.CONTRIBUTOR 
                               ? ideas.filter(idea => idea.submitterEmail === currentUser.email)
                               : ideas; // Evaluators/Admins see all ideas
        return (
          <>
            <div className="mb-10 text-center">
              <button
                onClick={startNewIdeaProcess}
                className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 btn-rounded transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-75"
                aria-label="Start new idea submission process"
              >
                <PlusCircleIcon className="w-6 h-6 mr-2.5" />
                Submit a New Idea
              </button>
            </div>
            {displayedIdeas.length > 0 && <h2 className="text-3xl font-bold uppercase text-neutral-darker mb-6 text-center sm:text-left">
              {currentUser.role === UserRole.CONTRIBUTOR ? "Your Submitted Ideas" : "All Submitted Ideas"}
            </h2>}
            <IdeaList 
                ideas={displayedIdeas} 
                currentUser={currentUser} 
                onDeleteIdea={handleDeleteIdea}
                onUpdateStatus={handleUpdateIdeaStatus}
                isDashboardView={false}
            />
          </>
        );
    }
  };

  const subTitleText = () => {
    if (!currentUser && workflowState !== 'login') return "Welcome! Please log in to continue.";
    switch(workflowState) {
      case 'login': return "Log in to access the Idea Hub.";
      case 'idle': return "Capture your brilliant ideas or view existing ones.";
      case 'categorySelection': return "First, let's categorize your idea.";
      case 'questionnaireChat': return "Chat with our AI Analyst to detail your idea.";
      case 'valueDefinition': return "Assess the potential value and effort.";
      case 'reviewerDashboard': return "Review and manage submitted ideas.";
      case 'submitting': 
      case 'submitted': 
      default: return "Processing your innovative thoughts...";
    }
  }

  useEffect(() => {
    const keyIsLikelyMissing = localStorage.getItem("MAGURE_API_KEY_WARNING_TRIGGER");
    if (keyIsLikelyMissing === "true") {
        setShowApiKeyWarning(true);
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-brandOrange via-brandPurple to-brandCyan py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <header className="text-center mb-8">
        <img src="/assets/Magure_Logo.png" alt="Magure Logo" className="h-12 md:h-14 mx-auto mb-4 cursor-pointer" onClick={navigateToHome}/>
        <p className="mt-2 text-lg text-neutral-darker font-body-medium max-w-2xl mx-auto">
         {subTitleText()}
        </p>
        {currentUser && (
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center text-neutral-extralight/90">
              <UserCircleIcon className="w-5 h-5 mr-1.5"/> 
              <span>{currentUser.email} ({currentUser.role})</span>
            </div>
            {(currentUser.role === UserRole.EVALUATOR || currentUser.role === UserRole.ADMIN) && workflowState !== 'reviewerDashboard' && (
              <button onClick={navigateToDashboard} className="text-sm text-highlight hover:text-white underline">Review Dashboard</button>
            )}
             {workflowState === 'reviewerDashboard' && (
              <button onClick={navigateToHome} className="text-sm text-highlight hover:text-white underline">Main Hub</button>
            )}
            <button onClick={() => logout()} className="text-sm text-neutral-extralight/70 hover:text-white flex items-center">
              <LogoutIcon className="w-5 h-5 mr-1"/> Logout
            </button>
          </div>
        )}
      </header>

      {(workflowState === 'questionnaireChat' || workflowState === 'valueDefinition') && currentQuestionnaireIdea && (
        <TopMetersDisplay scores={meterScores} />
      )}

      <main className="max-w-4xl mx-auto">
        {renderWorkflowContent()}
      </main>

      <footer className="text-center mt-16 py-6 border-t border-white/30">
        <p className="text-sm text-neutral-extralight/80 font-body-medium">
          Powered by MagLabs. &copy; Magure {new Date().getFullYear()}
        </p>
         {showApiKeyWarning && 
            <p className="text-xs text-secondary mt-1 bg-neutral-darker/70 p-1 rounded">
                Warning: The AI backend may not be configured correctly (API key issue). AI features might be disabled or mock.
            </p>
        }
      </footer>
    </div>
  );
};

export default App;
