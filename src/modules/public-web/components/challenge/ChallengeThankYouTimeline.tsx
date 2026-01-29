/**
 * ChallengeThankYouTimeline Component
 * 
 * Timeline - co bude dál
 * Ultra Premium Style: Méně je více (2 items), jasné, bez confusion
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

export function ChallengeThankYouTimeline() {
  const timelineItems = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: '26. února',
      description: 'Aplikace se ti otevře'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 11h8l-1 9 8-9h-8l1-9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      ),
      title: '1. března',
      description: 'Startuje výzva'
    }
  ];

  return (
    <div className="challenge-thank-you-timeline">
      <h2 className="challenge-thank-you-timeline__heading">
        Co bude dál
      </h2>

      <div className="challenge-thank-you-timeline__items">
        {timelineItems.map((item, index) => (
          <div key={index} className="challenge-thank-you-timeline-item">
            <div className="challenge-thank-you-timeline-item__icon">
              {item.icon}
            </div>
            <div className="challenge-thank-you-timeline-item__content">
              <h3 className="challenge-thank-you-timeline-item__title">
                {item.title}
              </h3>
              <p className="challenge-thank-you-timeline-item__description">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
