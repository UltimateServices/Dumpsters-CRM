interface StatsCardsProps {
  stats: {
    totalCities: number
    unpublishedCities: number
    draftPosts: number
    publishedPosts: number
    needsReview: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Cities',
      value: stats.totalCities.toLocaleString(),
      icon: '🏙️',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'Unpublished Cities',
      value: stats.unpublishedCities.toLocaleString(),
      icon: '🎯',
      color: 'bg-purple-50 text-purple-700',
      highlight: true
    },
    {
      label: 'Draft Posts',
      value: stats.draftPosts.toLocaleString(),
      icon: '📝',
      color: 'bg-yellow-50 text-yellow-700'
    },
    {
      label: 'Needs Review',
      value: stats.needsReview.toLocaleString(),
      icon: '👀',
      color: 'bg-orange-50 text-orange-700'
    },
    {
      label: 'Published Posts',
      value: stats.publishedPosts.toLocaleString(),
      icon: '✅',
      color: 'bg-green-50 text-green-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow p-6 ${card.highlight ? 'ring-2 ring-purple-500' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
            <div className={`text-4xl ${card.color} w-16 h-16 rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}