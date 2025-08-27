// src/app/dashboard/admin/loading.tsx
export default function AdminDashboardLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Admin Header Skeleton */}
            <div className="bg-primary-light rounded-xl p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-primary w-56 rounded mb-2"></div>
                        <div className="h-4 bg-primary w-80 rounded"></div>
                    </div>
                    <div className="h-10 w-40 bg-primary rounded-lg"></div>
                </div>
                <div className="mt-6 flex space-x-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-32 bg-primary rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-primary-light rounded-xl p-6 border border-gray-800">
                        <div className="h-4 bg-primary w-24 rounded mb-4"></div>
                        <div className="h-8 bg-primary w-32 rounded mb-2"></div>
                        <div className="h-3 bg-primary w-20 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* System Health Skeleton */}
                    <div className="bg-primary-light rounded-xl p-6 border border-gray-800">
                        <div className="h-6 bg-primary w-32 rounded mb-4"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i}>
                                    <div className="h-4 bg-primary w-20 rounded mb-2"></div>
                                    <div className="h-8 bg-primary w-24 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Skeleton */}
                    <div className="bg-primary-light rounded-xl p-6 border border-gray-800">
                        <div className="h-6 bg-primary w-32 rounded mb-4"></div>
                        <div className="h-64 bg-primary rounded"></div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Backup Status Skeleton */}
                    <div className="bg-primary-light rounded-xl p-6 border border-gray-800">
                        <div className="h-6 bg-primary w-32 rounded mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-16 bg-primary rounded"></div>
                            <div className="h-10 bg-primary rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}