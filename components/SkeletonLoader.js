import React from 'react';

/**
 * Global Skeleton Loader Component
 * Uygulama, Auth ve çeviri verileri yüklenirken gösterilir.
 * Basit bir landing page düzeninin iskeletini oluşturur.
 */
const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-[#111827] text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* Header İskeleti */}
      <div className="w-full h-16 flex items-center justify-between border-b border-gray-800 mb-8 max-w-7xl">
        <div className="h-6 w-32 bg-gray-800 rounded-full animate-pulse"></div>
        <div className="flex space-x-4 hidden md:flex">
          <div className="h-4 w-16 bg-gray-800 rounded-full animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-800 rounded-full animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-800 rounded-full animate-pulse"></div>
          <div className="h-8 w-24 bg-indigo-700/50 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Hero Section İskeleti */}
      <div className="w-full text-center py-16 max-w-4xl">
        <div className="h-10 w-3/4 mx-auto bg-gray-800 rounded-lg mb-4 animate-pulse"></div>
        <div className="h-6 w-1/2 mx-auto bg-gray-800 rounded-lg mb-8 animate-pulse"></div>
        <div className="h-16 w-full bg-gray-800/50 rounded-xl mb-4 animate-pulse"></div>
      </div>
      
      {/* Modül Bölümü İskeleti */}
      <div className="w-full max-w-6xl mt-12">
        <div className="h-8 w-48 mx-auto bg-gray-800 rounded-full mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 p-6 rounded-xl h-48 animate-pulse border border-gray-700">
              <div className="h-8 w-8 bg-indigo-700/50 rounded-full mb-4"></div>
              <div className="h-5 w-3/4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-5/6 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Placeholder */}
      <div className="mt-auto w-full max-w-7xl pt-12">
        <div className="h-4 w-40 bg-gray-800/50 rounded-full mx-auto animate-pulse"></div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
