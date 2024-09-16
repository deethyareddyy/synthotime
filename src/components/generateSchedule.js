const generateSchedule = (preferences, existingEvents) => {
    const { workHours, breakFrequency, preferredTasks } = preferences;

    // Example logic to generate a schedule
    const schedule = {
        workHours: workHours || '9am - 5pm',
        breakFrequency: breakFrequency || '1 hour',
        tasks: preferredTasks ? preferredTasks.split(',').map(task => ({
            name: task,
            duration: 60, // Default duration in minutes, you can adjust this
            startTime: null,
            endTime: null
        })) : []
    };

    // Adjust the schedule to avoid conflicts with existing events
    const adjustedSchedule = adjustScheduleForExistingEvents(schedule, existingEvents);

    return adjustedSchedule;
};

const adjustScheduleForExistingEvents = (schedule, existingEvents) => {
    // Implement logic to adjust the schedule based on existing events
    const adjustedTasks = schedule.tasks.map(task => {
        let taskStartTime = new Date();
        let taskEndTime = new Date(taskStartTime.getTime() + task.duration * 60000);

        // Find a time slot that does not conflict with existing events
        while (existingEvents.some(event => {
            const eventStart = new Date(event.startTime);
            const eventEnd = new Date(event.endTime);
            return (taskStartTime < eventEnd && taskEndTime > eventStart);
        })) {
            // Move the task start time to the end of the conflicting event
            taskStartTime = new Date(taskEndTime.getTime() + 60000); // Move by 1 minute
            taskEndTime = new Date(taskStartTime.getTime() + task.duration * 60000);
        }

        return {
            ...task,
            startTime: taskStartTime,
            endTime: taskEndTime
        };
    });

    return {
        ...schedule,
        tasks: adjustedTasks
    };
};

export default generateSchedule;