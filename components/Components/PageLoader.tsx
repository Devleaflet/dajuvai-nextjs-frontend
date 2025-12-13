import React from 'react';
import "@/styles/PageLoader.css";

const PageLoader: React.FC = () => {
  return (
    <div className="page-loader">
      <div className="page-loader__content">
        <img
          src="/assets/logo.webp"
          alt="DajuVai"
          className="page-loader__logo"
        />
      </div>
    </div>
  );
};

export default PageLoader; 