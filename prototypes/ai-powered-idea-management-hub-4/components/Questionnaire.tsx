
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CurrentQuestionnaireIdea, Response, ChatMessage, QuestionnaireInteractionState } from '../types';
import { evaluateAnswerAndSuggestNextStep } from '../services/geminiService';
import { SparklesIcon } from './icons'; 

interface QuestionnaireProps {
  ideaData: CurrentQuestionnaireIdea;
  onUpdate: (updatedIdeaData: CurrentQuestionnaireIdea) => void;
  onComplete: (finalizedIdeaData: CurrentQuestionnaireIdea) => void;
  onCancel: () => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ ideaData, onUpdate, onComplete, onCancel }) => {
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { 
    chatHistory, 
    currentQuestionSet, 
    currentSystemQuestionIndex, 
    interactionState,
    answers 
  } = ideaData;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatHistory]);

  useEffect(() => {
    if (interactionState === 'AI_INITIATING' && chatHistory.length === 0) {
      const firstQuestion = currentQuestionSet[0];
      if (firstQuestion) {
        const aiGreeting: ChatMessage = {
          id: uuidv4(),
          sender: 'ai',
          text: `Hello! I'm here to help you detail your idea. Let's start with the first question.`,
          timestamp: new Date(),
        };
        const aiFirstQuestion: ChatMessage = {
          id: uuidv4(),
          sender: 'ai',
          text: `${firstQuestion.theme}: ${firstQuestion.text}${firstQuestion.isMandatory ? ' (This is an important one!)' : ''}`,
          timestamp: new Date(),
          forQuestionId: firstQuestion.id,
        };
        onUpdate({ 
          ...ideaData, 
          chatHistory: [aiGreeting, aiFirstQuestion], 
          interactionState: 'AWAITING_USER_RESPONSE',
          currentSystemQuestionIndex: 0
        });
      }
    }
  }, [interactionState, chatHistory, currentQuestionSet, onUpdate, ideaData]);


  const handleSendMessage = async () => {
    if (currentUserMessage.trim() === '' || interactionState !== 'AWAITING_USER_RESPONSE') return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      text: currentUserMessage.trim(),
      timestamp: new Date(),
      forQuestionId: currentQuestionSet[currentSystemQuestionIndex]?.id,
    };

    const thinkingMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'ai',
        text: "Thinking...",
        timestamp: new Date(),
        aiThinks: true,
    };

    const newChatHistory = [...chatHistory, userMessage, thinkingMessage];
    onUpdate({
      ...ideaData,
      chatHistory: newChatHistory,
      interactionState: 'USER_RESPONDED_AI_EVALUATING',
    });
    setCurrentUserMessage('');

    const currentMainQuestion = currentQuestionSet[currentSystemQuestionIndex];
    const evaluation = await evaluateAnswerAndSuggestNextStep(currentMainQuestion, userMessage.text, chatHistory);

    const aiResponseMessage: ChatMessage = {
      id: uuidv4(),
      sender: 'ai',
      text: evaluation.aiResponseToUser,
      timestamp: new Date(),
      forQuestionId: currentMainQuestion.id,
      isClarification: evaluation.type === 'clarify',
    };
    
    let updatedAnswers = [...answers];
    let nextQuestionIndex = currentSystemQuestionIndex;
    let nextInteractionState: QuestionnaireInteractionState = 'AWAITING_USER_RESPONSE';
    let finalChatHistory = [...chatHistory, userMessage, aiResponseMessage];

    if (evaluation.type === 'proceed') {
      const existingAnswerIndex = updatedAnswers.findIndex(a => a.question_id === currentMainQuestion.id);
      const newAnswer: Response = {
        id: uuidv4(),
        idea_id: ideaData.id,
        question_id: currentMainQuestion.id,
        question_theme_id: currentMainQuestion.theme,
        user_id: ideaData.submitterEmail,
        response_text: evaluation.finalAnswerForQuestion || userMessage.text,
        response_attachments: [],
        responded_at: new Date(),
      };
      if (existingAnswerIndex > -1) {
        updatedAnswers[existingAnswerIndex] = newAnswer;
      } else {
        updatedAnswers.push(newAnswer);
      }
      
      nextQuestionIndex++; 

      if (nextQuestionIndex < currentQuestionSet.length) {
        const nextMainQuestion = currentQuestionSet[nextQuestionIndex];
        const aiNextQuestionMessage: ChatMessage = {
          id: uuidv4(),
          sender: 'ai',
          text: `Okay, moving on! ${nextMainQuestion.theme}: ${nextMainQuestion.text}${nextMainQuestion.isMandatory ? ' (This is an important one!)' : ''}`,
          timestamp: new Date(),
          forQuestionId: nextMainQuestion.id,
        };
        finalChatHistory.push(aiNextQuestionMessage);
        nextInteractionState = 'AWAITING_USER_RESPONSE';
      } else {
        const aiConcludingMessage: ChatMessage = {
          id: uuidv4(),
          sender: 'ai',
          text: "Great, that's all the questions I have! Thanks for sharing all these details. We're now finalizing your idea submission.",
          timestamp: new Date(),
        };
        finalChatHistory.push(aiConcludingMessage);
        nextInteractionState = 'AI_CONCLUDING';
         onUpdate({
          ...ideaData,
          chatHistory: finalChatHistory,
          answers: updatedAnswers,
          currentSystemQuestionIndex: nextQuestionIndex,
          interactionState: nextInteractionState,
        });
        onComplete({ ...ideaData, chatHistory: finalChatHistory, answers: updatedAnswers, currentSystemQuestionIndex: nextQuestionIndex });
        return; 
      }
    } else { 
      nextInteractionState = 'AWAITING_USER_RESPONSE'; 
    }

    onUpdate({
      ...ideaData,
      chatHistory: finalChatHistory,
      answers: updatedAnswers,
      currentSystemQuestionIndex: nextQuestionIndex,
      interactionState: nextInteractionState,
    });
  };

  const isSendDisabled = interactionState !== 'AWAITING_USER_RESPONSE' || currentUserMessage.trim() === '';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl flex flex-col h-[70vh] max-h-[700px]">
      <header className="mb-4 p-3 border-b border-neutral-light/70">
        <h2 className="text-xl font-bold uppercase text-neutral-darker flex items-center">
          <SparklesIcon className="w-6 h-6 mr-2 text-primary" />
          AI Idea Analyst
        </h2>
        {currentSystemQuestionIndex < currentQuestionSet.length && (
            <p className="text-xs text-neutral-DEFAULT mt-1">
                Guiding you through: {currentQuestionSet[currentSystemQuestionIndex]?.theme || 'Idea Details'} (Question {currentSystemQuestionIndex + 1} of {currentQuestionSet.length})
            </p>
        )}
      </header>

      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-3">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-xl shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : (msg.aiThinks ? 'bg-neutral-light text-neutral-dark animate-pulse italic rounded-bl-none' : 'bg-neutral-light text-neutral-darker rounded-bl-none')
            }`}>
              <p className="text-sm whitespace-pre-line font-body-medium">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-light/70 text-right' : 'text-neutral-DEFAULT text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="mt-auto border-t border-neutral-light/70 pt-4">
        <div className="flex items-center gap-2">
          <textarea
            value={currentUserMessage}
            onChange={(e) => setCurrentUserMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isSendDisabled) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={interactionState === 'AWAITING_USER_RESPONSE' ? "Type your response..." : "AI is processing..."}
            className="flex-grow p-3 border border-neutral-DEFAULT/70 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none font-body-medium"
            rows={2}
            aria-label="Chat input"
            disabled={interactionState !== 'AWAITING_USER_RESPONSE'}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSendDisabled}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-5 btn-rounded transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-neutral-DEFAULT hover:text-neutral-dark font-semibold py-2 px-1 mt-2"
        >
          Cancel & Discard Idea
        </button>
      </div>
    </div>
  );
};

export default Questionnaire;
