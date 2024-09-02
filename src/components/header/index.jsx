import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { doSignOut } from '../../firebase/auth'
import { firestore } from '../../firebase/firebase'
import { doc, setDoc } from 'firebase/firestore'

const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn, currentUser } = useAuth()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showEditPreferencesPopup, setShowEditPreferencesPopup] = useState(false)
    const [preferences, setPreferences] = useState({ preference1: '', preference2: '' })

    const handleLogout = () => {
        doSignOut().then(() => {
            navigate('/login')
        })
    }

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown)
    }

    const openEditPreferencesPopup = () => {
        setShowEditPreferencesPopup(true)
        setShowDropdown(false)
    }

    const closeEditPreferencesPopup = () => {
        setShowEditPreferencesPopup(false)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setPreferences({ ...preferences, [name]: value })
    }

    const handleSubmitPreferences = async () => {
        if (currentUser) {
            const preferencesRef = doc(firestore, 'users', currentUser.uid, 'preferences', 'answers')
            await setDoc(preferencesRef, preferences, { merge: true })
            closeEditPreferencesPopup()
        }
    }

    const getFirstLetter = () => {
        if (currentUser) {
            return currentUser.displayName 
                ? currentUser.displayName[0].toUpperCase() 
                : currentUser.email[0].toUpperCase()
        }
        return ''
    }

    return (
        <>
            <nav className='flex flex-row gap-x-2 w-full z-20 fixed top-0 left-0 h-12 border-b place-content-between items-center bg-gray-200 px-4'>
                <div className='text-lg font-semibold'>
                    SynthoCode SmartPilot
                </div>
                {
                    userLoggedIn
                        ?
                        <div className='relative'>
                            <div 
                                onClick={toggleDropdown} 
                                className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer'>
                                {getFirstLetter()}
                            </div>
                            {showDropdown && (
                                <div className='absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg'>
                                    <button 
                                        onClick={openEditPreferencesPopup} 
                                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'>
                                        Edit Preferences
                                    </button>
                                    <button 
                                        onClick={handleLogout} 
                                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                        :
                        <>
                            <Link className='text-sm text-blue-600 underline' to={'/login'}>Login</Link>
                            <Link className='text-sm text-blue-600 underline' to={'/register'}>Register New Account</Link>
                        </>
                }
            </nav>

            {showEditPreferencesPopup && (
                <div 
                    className='fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center' 
                    style={{ zIndex: 1000 }}
                >
                    <div className='bg-white p-4 rounded shadow-lg'>
                        <h2 className='text-lg font-semibold mb-4'>Edit Preferences</h2>
                        <div>
                            <label className='block text-sm font-medium mb-2'>Preference 1</label>
                            <input 
                                type='text' 
                                name='preference1' 
                                value={preferences.preference1} 
                                onChange={handleInputChange} 
                                className='border p-2 w-full mb-4' 
                            />
                            <label className='block text-sm font-medium mb-2'>Preference 2</label>
                            <input 
                                type='text' 
                                name='preference2' 
                                value={preferences.preference2} 
                                onChange={handleInputChange} 
                                className='border p-2 w-full mb-4' 
                            />
                        </div>
                        <div className='flex justify-end'>
                            <button 
                                onClick={closeEditPreferencesPopup} 
                                className='px-4 py-2 bg-gray-300 rounded mr-2'>
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitPreferences} 
                                className='px-4 py-2 bg-blue-600 text-white rounded'>
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Header
