// Fix: Add React import to resolve JSX namespace error.
import React from 'react';

interface UserBadgeProps {
  badge: string;
}

const badgeStyles: { [key: string]: { className: string; description: string; icon: JSX.Element } } = {
  'Pioneer': {
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'An early adopter of the Disrole platform.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><title>Pioneer Badge Icon</title><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  },
  'Creator': {
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Has successfully deployed one or more tokens.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><title>Creator Badge Icon</title><path fillRule="evenodd" d="M5 5a3 3 0 013-3h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3V5zm3 0a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>,
  },
  'Architect': {
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'A prolific creator who has deployed multiple tokens.',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><title>Architect Badge Icon</title><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  },
};

const UserBadge: React.FC<UserBadgeProps> = ({ badge }) => {
  const style = badgeStyles[badge];
  if (!style) return null;

  return (
    <span
      title={style.description}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${style.className} whitespace-nowrap`}
    >
      {style.icon}
      {badge}
    </span>
  );
};

export default UserBadge;
