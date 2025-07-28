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

    useEffect(() => {
        if (!assignmentTime) {
            setElapsed('00:00:00');
            return;
        }

        const startTime = moment(assignmentTime);

        const interval = setInterval(() => {
            const now = moment();
            const duration = moment.duration(now.diff(startTime));
            setElapsed(formatDuration(duration));
        }, 1000);

        // Set initial value immediately
        const initialDuration = moment.duration(moment().diff(startTime));
        setElapsed(formatDuration(initialDuration));

        return () => clearInterval(interval);
    }, [assignmentTime]);

    if (!assignmentTime) {
        return null;
    }

    const formattedAssignmentTime = moment(assignmentTime).format('DD/MM/YYYY HH:mm:ss');

    return (
        <Tooltip content={`Asignado el: ${formattedAssignmentTime}`}>
            <Chip 
                color="primary" 
                variant="flat" 
                className='hidden sm:flex items-center gap-1 font-mono'
                startContent={<Clock className="w-4 h-4" />}
            >
                {elapsed}
            </Chip>
        </Tooltip>
    );
};

export default memo(ElapsedTime);
