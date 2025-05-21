import React from 'react';

const PageHeader = ({ title, description, backLink, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200">
      <div>
        {backLink && <div className="mb-2">{backLink}</div>}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-gray-500">{description}</p>}
      </div>
      {actions && <div className="mt-4 md:mt-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;