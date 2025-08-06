// ErrorState.tsx
interface ErrorStateProps {
  message: string;
  retry?: () => void;
}

export const ErrorState = ({ message, retry }: ErrorStateProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-black/50 backdrop-blur-lg p-8 rounded-lg max-w-md">
        <p className="text-red-400 mb-4">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="bg-soless-blue text-white px-4 py-2 rounded hover:bg-soless-blue/80"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
