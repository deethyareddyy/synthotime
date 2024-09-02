import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getFirestore, collection, addDoc, getDocs, query, doc, getDoc, deleteDoc, updateDoc, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { gapi } from 'gapi-script';
import './App.css';

const localizer = momentLocalizer(moment);

const GoogleCalendar = () => {
    const [taskDuration, setTaskDuration] = useState('');
    const [taskName, setTaskName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('1');
    
    const [events, setEvents] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [eventDetails, setEventDetails] = useState({
        id: '',
        summary: '',
        description: '',
        start: '',
        end: '',
        isTask: false,
        priority: '1',
    });
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);

    const db = getFirestore();
    const auth = getAuth();

    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((new Date() - startTime) / 1000)); // Update every second
            }, 1000);
        } else if (!isRunning && startTime !== null) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRunning, startTime]);
    
    useEffect(() => {
        fetchEventsAndTasks();
        gapi.load('client:auth2', initClient);
    }, []);

    const initClient = () => {
        gapi.client.init({
            apiKey: 'AIzaSyDPCwZQ1ogpJyWhyKtSL2Bg9MjGoi45Mc0',
            clientId: '809093591150-ernrvkc2ccpm8lthjhsb76n468qqcmjn.apps.googleusercontent.com',
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: "https://www.googleapis.com/auth/calendar.events.readonly"
        }).then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    };

    const updateSigninStatus = (isSignedIn) => {
        if (isSignedIn) {
            listUpcomingEvents();
        } else {
            gapi.auth2.getAuthInstance().signIn();
        }
    };

    const listUpcomingEvents = () => {
        gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 2500,
            'orderBy': 'startTime'
        }).then(response => {
            const events = response.result.items.map(event => ({
                id: event.id,
                summary: event.summary,
                description: event.description,
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
                isTask: false, // Mark as event, not task
            }));

            saveGoogleEventsToFirebase(events);
        });
    };

    const saveGoogleEventsToFirebase = async (googleEvents) => {
        const user = auth.currentUser;
        if (user) {
            const eventsCollection = collection(db, "users", user.uid, "events");
            const existingEventsQuery = await getDocs(eventsCollection);
            const existingEvents = existingEventsQuery.docs.map(doc => ({
                id: doc.data().id,
                ...doc.data()
            }));

            for (const event of googleEvents) {
                const eventExists = existingEvents.some(existingEvent => existingEvent.id === event.id);
                if (!eventExists) {
                    const eventData = {
                        id: event.id,
                        summary: event.summary || "No Title",
                        description: event.description || "",
                        start: event.start,
                        end: event.end,
                        isTask: false, // Mark as event, not task
                    };
                    Object.keys(eventData).forEach(key => {
                        if (eventData[key] === undefined) {
                            delete eventData[key];
                        }
                    });
                    await addDoc(eventsCollection, eventData);
                }
            }

            fetchEventsAndTasks();
        }
    };

    const fetchEventsAndTasks = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const eventsQuery = query(collection(db, "users", user.uid, "events"));
                const tasksQuery = query(collection(db, "users", user.uid, "tasks"));
    
                const [eventsSnapshot, tasksSnapshot] = await Promise.all([
                    getDocs(eventsQuery),
                    getDocs(tasksQuery)
                ]);
    
                const eventsData = eventsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    start: new Date(doc.data().start.seconds * 1000),
                    end: new Date(doc.data().end.seconds * 1000),
                    isTask: false
                }));
    
                const tasksData = tasksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    start: new Date(doc.data().start.seconds * 1000),
                    end: new Date(doc.data().end.seconds * 1000),
                    isTask: true
                }));
    
                setEvents([...eventsData, ...tasksData]);
            }
        } catch (error) {
            console.error("Error fetching events/tasks:", error);
        }
    };    

    const deleteEventOrTask = async (eventId) => {
        try {
            const user = auth.currentUser;
            if (user) {
                // Determine the correct collection based on whether it's a task or an event
                const collectionName = eventDetails.isTask ? "tasks" : "events";
                const eventDoc = doc(db, "users", user.uid, collectionName, eventId);
    
                // Delete the document from Firebase
                await deleteDoc(eventDoc);
                console.log(`${eventDetails.isTask ? "Task" : "Event"} deleted:`, eventId);
    
                // Refresh the events and tasks to display on the calendar
                fetchEventsAndTasks();
    
                // Close the popup
                setShowPopup(false);
                setShowTaskPopup(false);
            }
        } catch (error) {
            console.error("Error deleting event/task:", error);
        }
    };    

    const updateEventOrTask = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                if (eventDetails.isTask) {
                    // If it's a task, recalculate the times using the scheduleTask logic
                    if (!startDate || !deadline) {
                        console.error("Start date or deadline is missing");
                        return;
                    }
    
                    // Calculate end time based on the updated duration
                    const duration = parseInt(taskDuration, 10);
                    const start = new Date(startDate);
                    const end = new Date(deadline);
                    const startTime = start;
                    const endTime = new Date(startTime.getTime() + duration * 60000);
    
                    if (endTime > end) {
                        console.error("Task duration exceeds deadline");
                        return;
                    }
    
                    const updatedTask = {
                        summary: taskName,
                        description: taskDescription,
                        priority: taskPriority,
                        start: startTime,
                        end: endTime,
                        isTask: true,
                    };
    
                    // Update the task in the "tasks" collection in Firebase
                    const taskDoc = doc(db, "users", user.uid, "tasks", eventDetails.id);
                    await updateDoc(taskDoc, updatedTask);
                    console.log("Task updated:", updatedTask);
                } else {
                    // If it's an event, update it as usual
                    const eventDoc = doc(db, "users", user.uid, "events", eventDetails.id);
                    const updatedEvent = {
                        summary: eventDetails.summary,
                        description: eventDetails.description,
                        start: new Date(eventDetails.start),
                        end: new Date(eventDetails.end),
                        priority: eventDetails.priority,
                    };
    
                    // Update the event in the "events" collection in Firebase
                    await updateDoc(eventDoc, updatedEvent);
                    console.log("Event updated:", updatedEvent);
                }
    
                // Refresh the events and tasks to display on the calendar
                fetchEventsAndTasks();
    
                // Close the popup
                setShowPopup(false);
                setShowTaskPopup(false);
            }
        } catch (error) {
            console.error("Error updating event/task:", error);
        }
    };
        

    const resetStopwatch = () => {
        setIsRunning(false);
        setStartTime(null);
        setEndTime(null);
        setElapsedTime(0);
    };

    const handleTaskOrEventClick = (event) => {
        setEventDetails({
            id: event.id,
            summary: event.summary,
            description: event.description,
            date: moment(event.start).format('YYYY-MM-DD'),
            time: moment(event.start).format('HH:mm'),
            isAllDay: event.isAllDay || false,
            start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
            end: moment(event.end).format('YYYY-MM-DDTHH:mm'),
            canCompleteWork: event.canCompleteWork || false,
            isTask: event.isTask || false,
            priority: event.priority || '1',
        });

        if (event.isTask) {
            setShowTaskPopup(true);
        } else {
            setShowPopup(true);
        }
    };

    const markTaskAsComplete = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const taskDoc = doc(db, "users", user.uid, "tasks", eventDetails.id);
    
                // Fetch the task data from the tasks collection
                const taskSnapshot = await getDoc(taskDoc);
                if (taskSnapshot.exists()) {
                    const taskData = taskSnapshot.data();
    
                    // Add the task to the completed_tasks collection
                    await addDoc(collection(db, "users", user.uid, "completed_tasks"), {
                        ...taskData,
                        completedAt: new Date(), // Add a timestamp for when the task was completed
                    });
    
                    // Delete the task from the tasks collection
                    await deleteDoc(taskDoc);
    
                    console.log("Task moved to completed_tasks:", eventDetails.id);
    
                    // Refresh the events and tasks to display on the calendar
                    fetchEventsAndTasks();
    
                    // Close the popup
                    setShowPopup(false);
                    setShowTaskPopup(false);
                } else {
                    console.error("Task not found in the tasks collection:", eventDetails.id);
                }
            }
        } catch (error) {
            console.error("Error moving task to completed_tasks:", error);
        }
    };
    

    const addEvent = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const event = {
                    summary: eventDetails.summary,
                    description: eventDetails.description,
                    start: new Date(eventDetails.start),
                    end: new Date(eventDetails.end),
                    isTask: eventDetails.isTask,
                    priority: eventDetails.priority,
                };

                await addDoc(collection(db, "users", user.uid, "events"), event);
                console.log("Event added:", event);
                fetchEventsAndTasks();
                setShowPopup(false);
                setShowTaskPopup(false);
            }
        } catch (error) {
            console.error("Error adding event/task:", error);
        }
    };

    const scheduleTask = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                // Ensure startDate and deadline are valid
                if (!startDate || !deadline) {
                    console.error("Start date or deadline is missing");
                    return;
                }
    
                // Calculate end time based on the duration
                const duration = parseInt(taskDuration, 10);
                const start = new Date(startDate);
                const end = new Date(deadline);
                const startTime = start;
                const endTime = new Date(startTime.getTime() + duration * 60000);
    
                if (endTime > end) {
                    console.error("Task duration exceeds deadline");
                    return;
                }
    
                const task = {
                    summary: taskName,
                    description: taskDescription,
                    priority: taskPriority,
                    start: startTime,
                    end: endTime,
                    isTask: true,  // Ensure isTask is set to true when creating a task
                };
    
                // Add the task to the "tasks" sub-collection in Firebase
                await addDoc(collection(db, "users", user.uid, "tasks"), task);
                console.log("Task scheduled:", task);
    
                // Refresh the events and tasks to display on the calendar
                fetchEventsAndTasks();
    
                // Close the popup
                setShowTaskPopup(false);
            }
        } catch (error) {
            console.error("Error scheduling task:", error);
        }
    };
      

    const handleDateClick = (date) => {
        const currentTime = moment().format('YYYY-MM-DDTHH:mm');
        const oneHourLater = moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
        
        setEventDetails({
            id: null,
            summary: '',
            description: '',
            start: moment(date).format('YYYY-MM-DD') + 'T' + moment().format('HH:mm'),
            end: moment(date).format('YYYY-MM-DD') + 'T' + moment().add(1, 'hour').format('HH:mm'),
            isTask: false,
            priority: '1',
        });
        setShowPopup(true);
    };

    const [showCompletedTasksPopup, setShowCompletedTasksPopup] = useState(false);
    const [completedTasks, setCompletedTasks] = useState([]);
    
    const fetchCompletedTasks = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const completedTasksQuery = query(
                    collection(db, "users", user.uid, "completed_tasks"),
                    orderBy("completedAt", "desc") // Order by completion date, most recent first
                );
                const completedTasksSnapshot = await getDocs(completedTasksQuery);
                const tasks = completedTasksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    completedAt: doc.data().completedAt.toDate(),
                }));
                setCompletedTasks(tasks);
            }
        } catch (error) {
            console.error("Error fetching completed tasks:", error);
        }
    };    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventDetails({ ...eventDetails, [name]: value });
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '';
    
        if (event.isTask) {
            // Set background color based on task priority
            switch (event.priority) {
                case '1':
                    backgroundColor = 'red';
                    break;
                case '2':
                    backgroundColor = 'orange';
                    break;
                case '3':
                    backgroundColor = 'yellow';
                    break;
                case '4':
                    backgroundColor = 'green';
                    break;
                default:
                    backgroundColor = '#FF8C00'; // Default color for tasks
            }
        } else {
            // Default color for events
            backgroundColor = '#3174ad';
        }
    
        let style = {
            backgroundColor: backgroundColor,
            borderRadius: '0px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block',
        };
    
        return {
            style: style
        };
    };
    

    const EventComponent = ({ event }) => (
        <span>
            <strong>{event.summary}</strong>
        </span>
    );

    const startStopwatch = () => {
        setStartTime(new Date());
        setIsRunning(true);
    };

    const closePopup = () => {
        setEventDetails({
            id: null,
            summary: '',
            description: '',
            start: '',
            end: '',
            isTask: false,
            priority: '1',
        });
        setShowPopup(false);
        setShowTaskPopup(false);
    };
    

    const stopStopwatch = async () => {
        const end = new Date();
        setEndTime(end);
        setIsRunning(false);

        const user = auth.currentUser;
        if (user) {
            const sessionData = {
                start: startTime,
                end: end,
                duration: (end - startTime) / 1000, // Duration in seconds
            };

            await addDoc(collection(db, "users", user.uid, "sessions"), sessionData);
            console.log("Productivity session saved:", sessionData);
        }
    };

    return (
        <div>
            {/* Sync With Google Calendar Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button onClick={() => gapi.auth2.getAuthInstance().signIn()}>
                    Sync With Google Calendar
                </button>
            </div>

            <button onClick={() => {
                fetchCompletedTasks();
                setShowCompletedTasksPopup(true);
            }}>
                See Completed Tasks
            </button>

            {/* Add Button with Dropdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <div className="dropdown">
                    <button className="dropbtn">Add &#9662;</button>
                    <div className="dropdown-content">
                        <a href="#!" onClick={() => {
                            const currentTime = moment().format('YYYY-MM-DDTHH:mm');
                            const oneHourLater = moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
                            setEventDetails({
                                id: null, // Ensure id is null to indicate a new event
                                summary: '',
                                description: '',
                                start: currentTime,
                                end: oneHourLater,
                                isTask: false,
                                priority: '1',
                            });
                            setShowPopup(true);
                        }}>Event</a>
                        <a href="#!" onClick={() => {
                            const currentTime = moment().format('YYYY-MM-DDTHH:mm');
                            const oneHourLater = moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm');
                            setEventDetails({
                                id: null, // Reset id to null to indicate a new task
                                summary: '',
                                description: '',
                                start: currentTime,
                                end: oneHourLater,
                                isTask: true,
                                priority: '1',
                            });
                            setShowTaskPopup(true);
                        }}>
                            Task
                        </a>
                    </div>
                </div>
            </div>

            {showCompletedTasksPopup && (
                <div className="popup">
                    <h2>Completed Tasks</h2>
                    <button onClick={() => setShowCompletedTasksPopup(false)}>Close</button>
                    <div>
                        {completedTasks.length === 0 ? (
                            <p>No completed tasks found.</p>
                        ) : (
                            // Group tasks by completion date
                            Object.entries(
                                completedTasks.reduce((acc, task) => {
                                    const date = moment(task.completedAt).format('MMMM Do YYYY');
                                    if (!acc[date]) acc[date] = [];
                                    acc[date].push(task);
                                    return acc;
                                }, {})
                            ).map(([date, tasks]) => (
                                <div key={date}>
                                    <h3>{date}</h3>
                                    <ul>
                                        {tasks.map(task => (
                                            <li key={task.id}>
                                                {task.summary} - {moment(task.completedAt).format('h:mm a')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {showPopup && (
                <div className="popup">
                    <h2>{eventDetails.id ? "Edit Event" : "Create New Event"}</h2>
                    <input
                        type="text"
                        placeholder="Event Name"
                        name="summary"
                        value={eventDetails.summary}
                        onChange={handleInputChange}
                    />
                    <textarea
                        placeholder="Description (optional)"
                        name="description"
                        value={eventDetails.description}
                        onChange={handleInputChange}
                    />
                    <input
                        type="datetime-local"
                        name="start"
                        value={eventDetails.start}
                        onChange={handleInputChange}
                    />
                    <input
                        type="datetime-local"
                        name="end"
                        value={eventDetails.end}
                        onChange={handleInputChange}
                    />
                    <button onClick={eventDetails.id ? updateEventOrTask : addEvent}>
                        {eventDetails.id ? "Save Changes" : "Create Event"}
                    </button>
                    {eventDetails.id && (
                        <>
                            <button onClick={() => {
                                deleteEventOrTask(eventDetails.id);
                                closePopup();
                            }}>Delete</button>

                        </>
                    )}
                    <button onClick={closePopup}>Cancel</button>
                </div>
            )}



            {showTaskPopup && (
                <div className="popup">
                    <h2>{eventDetails.id ? "Edit Task" : "Schedule New Task"}</h2>
                    <input
                        type="text"
                        placeholder="Task Name"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Task Duration (minutes)"
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(e.target.value)}
                    />
                    <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                    >
                        <option value="1">Priority 1</option>
                        <option value="2">Priority 2</option>
                        <option value="3">Priority 3</option>
                        <option value="4">Priority 4</option>
                    </select>
                    <input
                        type="datetime-local"
                        placeholder="Earliest Start Time"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                        type="datetime-local"
                        placeholder="Deadline"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                    />
                    <button onClick={eventDetails.id ? updateEventOrTask : scheduleTask}>
                        {eventDetails.id ? "Save Changes" : "Schedule Task"}
                    </button>
                    {eventDetails.id && (
                        <>
                            <button onClick={() => {
                                deleteEventOrTask(eventDetails.id);
                                closePopup();
                            }}>Delete</button>
                            <button onClick={markTaskAsComplete}>Mark as Complete</button>
                        </>
                    )}
                    <button onClick={closePopup}>Cancel</button>
                </div>
            )}


            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                selectable={true}
                onSelectEvent={handleTaskOrEventClick}
                onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
                eventPropGetter={eventStyleGetter}
                components={{
                    event: EventComponent
                }}
            />

            {/* <div style={{ marginTop: '20px' }}>
                <h2>Manage Events</h2>
                {events.map(event => (
                    <div key={event.id} style={{ marginBottom: '10px' }}>
                        <div>
                            <strong>{event.summary}</strong>
                            <p>Start: {moment(event.start).format('MMMM Do YYYY, h:mm a')}</p>
                            <p>End: {moment(event.end).format('MMMM Do YYYY, h:mm a')}</p>
                        </div>
                        <button onClick={() => deleteEventOrTask(event.id)}>Delete {event.isTask ? "Task" : "Event"}</button>
                        <button onClick={() => handleTaskOrEventClick(event)}>Edit {event.isTask ? "Task" : "Event"}</button>
                    </div>
                ))}
            </div>
            <br /> */}
            <div style={{ marginTop: '20px' }}>
                <h2><b>Start Productivity Session</b></h2>
                <div>
                    {isRunning ? `Elapsed Time: ${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s` : `Total Time: ${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={startStopwatch} disabled={isRunning}>
                        Start
                    </button>
                    <button onClick={stopStopwatch} disabled={!isRunning}>
                        Stop
                    </button>
                    <button onClick={resetStopwatch} disabled={isRunning}>
                        Reset
                    </button>
                    <div>
                        {isRunning ? "Stopwatch is running..." : "Stopwatch is stopped."}
                    </div>
                </div>
                <p>*It is recommended to start a session when working. Productivity sessions are used to understand times of increased individual productivity and better create schedules.</p>
                <br />
            </div>
        </div>
    );
};

export default GoogleCalendar;