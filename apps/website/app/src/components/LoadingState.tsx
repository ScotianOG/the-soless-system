// LoadingState.tsx
export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-black/50 backdrop-blur-lg p-8 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="w-6 h-6 border-2 border-soless-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-soless-blue">Loading...</p>
        </div>
      </div>
    </div>
  );
};
