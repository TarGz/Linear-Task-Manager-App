import './LoadingState.css';

function LoadingState({ message = "Loading...", size = "default" }) {
  return (
    <div className={`loading-state ${size}`}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingState;