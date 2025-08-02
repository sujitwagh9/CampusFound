export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col justify-center items-center h-40 space-y-2">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}
