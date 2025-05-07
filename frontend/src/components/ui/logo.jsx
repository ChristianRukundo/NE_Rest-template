export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <div className="absolute top-0 left-0 w-6 h-6 bg-blue-500 rounded-sm transform rotate-45"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 bg-red-500 rounded-sm"></div>
        <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-sm"></div>
      </div>
    </div>
  );
};
