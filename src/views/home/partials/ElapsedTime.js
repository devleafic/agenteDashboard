import React, { useState, useEffect, memo } from 'react';
import moment from 'moment';
import { Chip, Tooltip } from '@heroui/react';

// --- SVG Icon Components ---
const Clock = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const formatDuration = (duration) => {
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ElapsedTime = ({ assignmentTime }) => {
    const [elapsed, setElapsed] = useState('00:00:00');
    const [chipColor, setChipColor] = useState('primary');

    useEffect(() => {
        if (!assignmentTime) {
            setElapsed('00:00:00');
            setChipColor('primary');
            return;
        }

        const startTime = moment(assignmentTime);

        const updateElapsed = () => {
            const now = moment();
            const duration = moment.duration(now.diff(startTime));
            
            setElapsed(formatDuration(duration));

            const totalMinutes = duration.asMinutes();
            if (totalMinutes > 30) {
                setChipColor('danger');
            } else if (totalMinutes > 15) {
                setChipColor('warning');
            } else {
                setChipColor('primary');
            }
        };

        const interval = setInterval(updateElapsed, 1000);

        updateElapsed(); // Set initial value immediately

        return () => clearInterval(interval);
    }, [assignmentTime]);

    if (!assignmentTime) {
        return null;
    }

    const formattedAssignmentTime = moment(assignmentTime).format('DD/MM/YYYY HH:mm:ss');

    return (
        <Tooltip content={`Asignado el: ${formattedAssignmentTime}`}>
            <Chip 
                color={chipColor}
                variant="flat" 
                size="sm"
                className='hidden sm:flex items-center gap-1 font-mono'
                startContent={<Clock className="w-4 h-4" />}
            >
                {elapsed}
            </Chip>
        </Tooltip>
    );
};

export default memo(ElapsedTime);
