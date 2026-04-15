export function SkeletonLoader({ width = 'w-full', height = 'h-4' }) {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded animate-pulse`}></div>
  )
}

export function ProjectSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <SkeletonLoader width="w-3/4" height="h-6" />
      <SkeletonLoader width="w-full" height="h-4" />
      <SkeletonLoader width="w-5/6" height="h-4" />
      <div className="space-y-2">
        <SkeletonLoader width="w-full" height="h-2" />
        <SkeletonLoader width="w-4/5" height="h-2" />
      </div>
    </div>
  )
}

export function InvoiceSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between">
        <SkeletonLoader width="w-1/3" height="h-5" />
        <SkeletonLoader width="w-1/4" height="h-5" />
      </div>
      <SkeletonLoader width="w-full" height="h-4" />
      <SkeletonLoader width="w-3/4" height="h-4" />
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <SkeletonLoader width="w-1/2" height="h-4" />
          <SkeletonLoader width="w-2/3" height="h-8" />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonLoader width="w-1/3" height="h-10" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <ProjectSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
