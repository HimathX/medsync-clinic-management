import React from 'react';

const CategorySidebar = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-sidebar">
      <div className="categories-card">
        <h2 className="categories-title">Categories</h2>
        
        <div className="category-list">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="category-name">{category.name}</span>
              <div className="category-meta">
                {category.popular && (
                  <span className="popular-badge">Popular</span>
                )}
                <span className="category-count">{category.count}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;
