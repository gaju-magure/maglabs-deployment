
import React, { useState } from 'react';
import { IdeaCategoryEnum } from '../types';
import { CheckCircleIcon, TagIcon } from './icons';

interface CategorySelectorProps {
  onSubmit: (selectedCategories: IdeaCategoryEnum[]) => void;
  onCancel: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onSubmit, onCancel }) => {
  const [selectedCategories, setSelectedCategories] = useState<IdeaCategoryEnum[]>([]);

  const toggleCategory = (category: IdeaCategoryEnum) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category for your idea.');
      return;
    }
    onSubmit(selectedCategories);
  };

  const availableCategories = Object.values(IdeaCategoryEnum).filter(cat => cat !== IdeaCategoryEnum.UNCATEGORIZED);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex items-center mb-6">
        <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mr-3" />
        <h2 className="text-2xl sm:text-3xl font-bold uppercase text-neutral-darker">Categorize Your Idea</h2>
      </div>
      <p className="text-neutral-dark font-body-medium mb-2">
        Select one or more categories that best describe your idea. This will help us ask relevant follow-up questions.
      </p>
      <p className="text-sm text-neutral-DEFAULT mb-6">
        Choose the most fitting primary category first, then add any relevant secondary ones.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" role="group" aria-label="Idea Categories">
        {availableCategories.map(category => (
          <button
            type="button"
            key={category}
            onClick={() => toggleCategory(category)}
            className={`p-4 border btn-rounded text-left transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light
              ${selectedCategories.includes(category)
                ? 'bg-primary text-white border-primary-dark shadow-md scale-105'
                : 'bg-neutral-extralight hover:bg-neutral-light text-neutral-darker border-neutral-DEFAULT/70 hover:shadow-sm'
              }`}
            aria-pressed={selectedCategories.includes(category)}
          >
            <div className="flex items-center">
              <TagIcon className={`w-5 h-5 mr-2.5 ${selectedCategories.includes(category) ? 'text-white' : 'text-primary'}`} />
              <span className="font-semibold">{category}</span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
        <button
            type="button"
            onClick={onCancel}
            className="text-neutral-dark hover:text-neutral-darker font-semibold py-2.5 px-6 btn-rounded transition duration-150 border border-neutral-DEFAULT hover:border-neutral-dark"
        >
            Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-8 btn-rounded transition duration-150"
        >
          Next: Ask Questions
        </button>
      </div>
    </div>
  );
};

export default CategorySelector;
