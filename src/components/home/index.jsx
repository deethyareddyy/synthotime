import React from 'react';
import { useAuth } from '../../contexts/authContext';
import GoogleCalendar from '../GoogleCalendar';

const Home = () => {
    const { currentUser } = useAuth();
    return (
        <div>
            <div className='text-2xl font-bold pt-14'>
                {currentUser.displayName ? currentUser.displayName : currentUser.email}'s Calendar
            </div>
            <GoogleCalendar /> {/* Integrate the GoogleCalendar component here */}
        </div>
    );
};

export default Home;