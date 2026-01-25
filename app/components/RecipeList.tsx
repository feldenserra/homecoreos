import React, { useState } from 'react';

interface Recipe {
    id: string;
    name: string;
    description?: string;
}

interface RecipeListProps {
    recipes: Recipe[];
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes }) => {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecipe(null);
    };

    return (
        <>
            <div className="recipe-list">
                {recipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        className="recipe-item"
                        onClick={() => handleRecipeClick(recipe)}
                        style={{ cursor: 'pointer', padding: '1rem', border: '1px solid #ccc', marginBottom: '0.5rem' }}
                    >
                        <h3>{recipe.name}</h3>
                        {recipe.description && <p>{recipe.description}</p>}
                    </div>
                ))}
            </div>

            {isModalOpen && selectedRecipe && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px' }}>
                        <h2>{selectedRecipe.name}</h2>
                        <p>{selectedRecipe.description}</p>
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
};