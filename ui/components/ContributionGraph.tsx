'use client';

import { useState, useMemo, memo, useCallback, useEffect } from 'react';

interface ContributionData {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no contributions, 4 = max
}

interface ContributionGraphProps {
  contributions: Map<string, number>; // Map of "YYYY-MM-DD" to count
  selectedYear?: number; // Year to display (defaults to last year)
  onDotClick?: (date: Date, count: number) => void;
}

// GitHub's exact color scheme for light mode
const GITHUB_COLORS_LIGHT = {
  0: '#ebedf0', // light gray for empty
  1: '#9be9a8', // light green
  2: '#40c463', // medium green
  3: '#30a14e', // dark green
  4: '#216e39', // darkest green
};

// Darker colors for dark mode empty squares
const GITHUB_COLORS_DARK = {
  0: '#161b22', // dark for empty in dark mode
  1: '#0e4429', // dark green
  2: '#006d32', // medium dark green
  3: '#26a641', // medium green
  4: '#39d353', // light green
};

// Get contribution level from count (GitHub's algorithm)
function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

// Get all dates for a specific year
function getYearDates(year: number): Date[] {
  const dates: Date[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// Organize contributions by weeks (GitHub style - Sunday to Saturday)
function organizeByWeeks(dates: Date[], contributions: Map<string, number>): (ContributionData | null)[][] {
  const weeks: (ContributionData | null)[][] = [];
  
  // Create a map for quick date lookup
  const dateMap = new Map<string, Date>();
  dates.forEach(date => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dateMap.set(key, date);
  });
  
  // Find the first Sunday (GitHub starts weeks on Sunday)
  const firstDate = dates[0];
  const firstDayOfWeek = firstDate.getDay();
  const daysToSunday = firstDayOfWeek === 0 ? 0 : firstDayOfWeek;
  
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - daysToSunday);
  
  const endDate = dates[dates.length - 1];
  const currentDate = new Date(startDate);
  let currentWeek: (ContributionData | null)[] = [];
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // If it's Sunday and we have a week, start a new week
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
    
    // Check if this date is in our range
    if (dateMap.has(dateKey)) {
      const count = contributions.get(dateKey) || 0;
      currentWeek.push({
        date: new Date(currentDate),
        count,
        level: getLevel(count),
      });
    } else {
      // Fill empty days at the start/end of the range
      currentWeek.push(null);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Add the last week if it has any days
  if (currentWeek.length > 0) {
    // Pad to 7 days if needed
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

// Memoized dot component for performance
const ContributionDot = memo(({ 
  contribution, 
  isHovered, 
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  color
}: { 
  contribution: ContributionData;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  color: string;
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <button
      className={`w-3 h-3 transition-all duration-150 cursor-pointer ${
        isHovered ? 'ring-2 ring-black dark:ring-white ring-offset-1' : ''
      }`}
      style={{
        backgroundColor: color,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${contribution.count} ${contribution.count === 1 ? 'contribution' : 'contributions'} on ${formatDate(contribution.date)}`}
      aria-label={`${contribution.count} contributions on ${formatDate(contribution.date)}`}
    />
  );
});

ContributionDot.displayName = 'ContributionDot';

function ContributionGraph({ contributions, selectedYear, onDotClick }: ContributionGraphProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isDark, setIsDark] = useState(false);
  
  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);
  
  const year = selectedYear || new Date().getFullYear();
  const dates = useMemo(() => getYearDates(year), [year]);
  const weeks = useMemo(() => organizeByWeeks(dates, contributions), [dates, contributions]);

  const handleDotClick = useCallback((contribution: ContributionData) => {
    onDotClick?.(contribution.date, contribution.count);
  }, [onDotClick]);
  
  const getColor = useCallback((level: number) => {
    const colors = isDark ? GITHUB_COLORS_DARK : GITHUB_COLORS_LIGHT;
    return colors[level as keyof typeof colors];
  }, [isDark]);

  // Get month labels (GitHub style - shows every few weeks)
  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay) {
        const currentMonth = firstDay.date.getMonth();
        if (currentMonth !== lastMonth) {
          labels.push(firstDay.date.toLocaleDateString('en-US', { month: 'short' }));
          lastMonth = currentMonth;
        } else {
          labels.push(null);
        }
      } else {
        labels.push(null);
      }
    });
    
    return labels;
  }, [weeks]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-2 p-4">
        {/* Month labels */}
        <div className="flex gap-1 pl-7">
          {monthLabels.map((month, idx) => (
            <div
              key={idx}
              className="text-xs text-black dark:text-white"
              style={{ width: '13px' }}
            >
              {month || ''}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 justify-start pt-2">
            {dayLabels.map((day, idx) => (
              <div
                key={idx}
                className="text-xs text-black dark:text-white"
                style={{ height: '11px', lineHeight: '11px', width: '25px' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Graph grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((contribution, dayIdx) => {
                  if (!contribution) {
                    return (
                      // <></>
                      <div
                        key={dayIdx}
                        className="w-3 h-3"
                        style={{ backgroundColor: getColor(0) }}
                      />
                    );
                  }

                  const isHovered =
                    hoveredDate &&
                    contribution.date.toDateString() === hoveredDate.toDateString();

                  return (
                    <ContributionDot
                      key={dayIdx}
                      contribution={contribution}
                      isHovered={isHovered as boolean}
                      onClick={() => handleDotClick(contribution)}
                      onMouseEnter={() => setHoveredDate(contribution.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      color={getColor(contribution.level)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 pt-4 text-xs text-black dark:text-white">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(level) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ContributionGraph);
