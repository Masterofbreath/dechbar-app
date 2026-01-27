/**
 * ChallengeTimeline Component
 * 
 * Vertikální timeline ukazující "Co tě čeká"
 * Apple Premium: Journey visualization (ne kroky)
 * 
 * Layout: Vertical timeline s teal linkou
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { MESSAGES } from '@/config/messages';

const TIMELINE_STEPS = [
  {
    date: MESSAGES.challenge.timeline.now,
    action: MESSAGES.challenge.timeline.nowAction,
    completed: false,
  },
  {
    date: MESSAGES.challenge.timeline.registration,
    action: MESSAGES.challenge.timeline.registrationAction,
    completed: false,
  },
  {
    date: MESSAGES.challenge.timeline.start,
    action: MESSAGES.challenge.timeline.startAction,
    completed: false,
  },
];

export function ChallengeTimeline() {
  return (
    <section className="challenge-timeline">
      <div className="challenge-timeline__container">
        <h2 className="challenge-timeline__title">
          {MESSAGES.challenge.timeline.title}
        </h2>

        <div className="challenge-timeline__steps">
          {TIMELINE_STEPS.map((step, index) => (
            <div 
              key={index} 
              className={`challenge-timeline__step ${step.completed ? 'challenge-timeline__step--completed' : ''}`}
            >
              <div className="challenge-timeline__date">
                {step.date}
              </div>
              <div className="challenge-timeline__action">
                {step.action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
