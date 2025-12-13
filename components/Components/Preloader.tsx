import React from 'react';
import "@/styles/Preloader.css";

interface PreloaderProps {
  isVisible?: boolean;
  fullScreen?: boolean;
  text?: string;
}

const Preloader: React.FC<PreloaderProps> = ({
  isVisible = true,
  fullScreen = true,
  text = "Loading..."
}) => {
  if (!isVisible) return null;

  return (
    <div className={`preloader ${fullScreen ? 'preloader--fullscreen' : 'preloader--inline'}`}>
      <div className="preloader__content">
        <div className="preloader__logo-container">
          <img src="/assets/logo.webp" alt="Daju Vai" className="preloader__logo" />
        </div>
        <div className="preloader__spinner">
          <div className="preloader__spinner-ring"></div>
          <div className="preloader__spinner-ring"></div>
          <div className="preloader__spinner-ring"></div>
        </div>
        <div className="preloader__text">{text}</div>
      </div>
    </div>
  );
};

export default Preloader; 