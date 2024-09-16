import React, { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/authContext';
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import '../../../Styles.css';

const Register = () => {
    const navigate = useNavigate();
    const [name, setName] = useState(''); // Added state for name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { userLoggedIn } = useAuth();

    const db = getFirestore();
    const auth = getAuth();

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return;
        }

        if (!isRegistering) {
            setIsRegistering(true);

            try {
                const userCredential = await doCreateUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update the user's displayName with the given name
                await updateProfile(user, {
                    displayName: name,
                });

                // Add the user's uid, name, and email to the "users" collection in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name: name, // Added name to the Firestore document
                    email: user.email,
                    createdAt: new Date(),
                    // add any other default user data here
                });

                // Navigate to home page or any other page after successful registration
                //navigate('/home');
                navigate('quiz');
            } catch (error) {
                setErrorMessage(error.message);
            } finally {
                setIsRegistering(false);
            }
        }
    };

    return (
        <>
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

            <div className="background-overlay"></div>

            <main className="w-full h-screen flex justify-center items-center">
            <div className="w-full max-w-sm h-auto text-gray-600 space-y-4 p-4 shadow-xl border rounded-xl bg-white mt-10">
                <div className="text-center mb-4">
                    <h3 className="text-gray-800 text-lg font-semibold sm:text-xl">Create a New Account</h3>
                </div>
                <form
                    onSubmit={onSubmit}
                    className="space-y-4"
                >
                    <div>
                        <label className="text-xs text-gray-600 font-bold">
                            Email
                        </label>
                        <input
                            type="email"
                            autoComplete='email'
                            required
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); }}
                            className="w-full mt-1 px-2 py-1 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-600 font-bold">
                            Name
                        </label>
                        <input
                            type="text"
                            autoComplete='name'
                            required
                            value={name}
                            onChange={(e) => { setName(e.target.value); }}
                            className="w-full mt-1 px-2 py-1 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-600 font-bold">
                            Password
                        </label>
                        <input
                            disabled={isRegistering}
                            type="password"
                            autoComplete='new-password'
                            required
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); }}
                            className="w-full mt-1 px-2 py-1 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-600 font-bold">
                            Confirm Password
                        </label>
                        <input
                            disabled={isRegistering}
                            type="password"
                            autoComplete='off'
                            required
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); }}
                            className="w-full mt-1 px-2 py-1 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                        />
                    </div>

                    {errorMessage && (
                        <span className='text-red-600 text-xs font-bold'>{errorMessage}</span>
                    )}

                    <button
                        type="submit"
                        disabled={isRegistering}
                        className={`w-full px-4 py-2 text-white text-sm font-medium rounded-lg ${isRegistering ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'}`}
                    >
                        {isRegistering ? 'Signing Up...' : 'Sign Up'}
                    </button>
                    <div className="text-xs text-center">
                        Already have an account? {' '}
                        <Link to={'/login'} className="text-indigo-600 hover:underline font-bold">Login</Link>
                    </div>
                </form>
            </div>
        </main>
            <div className="floating-clock">
                <div className="clock-face">
                    <div className="hand hour-hand"></div>
                    <div className="hand minute-hand"></div>
                    <div className="hand second-hand"></div>
                </div>
            </div>
            <div className="jelly1 shape"></div>
            <div className="jelly2 shape"></div>
            <div className="jelly3 shape"></div>
            <div className="square shape"></div>
            <div className="diamond shape"></div>
            <div className="oval shape"></div>
            <div className="triangle shape"></div>
            <div className="pentagon shape"></div>
            <div className="hexagon shape"></div>
            <div className="star shape"></div>
            <div className="parallelogram shape"></div>
            <div className="lower-left-shape shape"></div>
            <div className="trapezoid"></div>
            <div className="dodecagon"></div>
        </>
    );
};

export default Register;



// import React, { useState } from 'react'
// import { Navigate, Link, useNavigate } from 'react-router-dom'
// import { useAuth } from '../../../contexts/authContext'
// import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'

// const Register = () => {

//     const navigate = useNavigate()

//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [confirmPassword, setconfirmPassword] = useState('')
//     const [isRegistering, setIsRegistering] = useState(false)
//     const [errorMessage, setErrorMessage] = useState('')

//     const { userLoggedIn } = useAuth()

//     const onSubmit = async (e) => {
//         e.preventDefault()
//         if(!isRegistering) {
//             setIsRegistering(true)
//             await doCreateUserWithEmailAndPassword(email, password)
//             // use react router to push a new link
//         }
//     }

//     return (
//         <>
//             {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

//             <main className="w-full h-screen flex self-center place-content-center place-items-center">
//                 <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
//                     <div className="text-center mb-6">
//                         <div className="mt-2">
//                             <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">Create a New Account</h3>
//                         </div>

//                     </div>
//                     <form
//                         onSubmit={onSubmit}
//                         className="space-y-4"
//                     >
//                         <div>
//                             <label className="text-sm text-gray-600 font-bold">
//                                 Email
//                             </label>
//                             <input
//                                 type="email"
//                                 autoComplete='email'
//                                 required
//                                 value={email} onChange={(e) => { setEmail(e.target.value) }}
//                                 className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
//                             />
//                         </div>

//                         <div>
//                             <label className="text-sm text-gray-600 font-bold">
//                                 Password
//                             </label>
//                             <input
//                                 disabled={isRegistering}
//                                 type="password"
//                                 autoComplete='new-password'
//                                 required
//                                 value={password} onChange={(e) => { setPassword(e.target.value) }}
//                                 className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
//                             />
//                         </div>

//                         <div>
//                             <label className="text-sm text-gray-600 font-bold">
//                                 Confirm Password
//                             </label>
//                             <input
//                                 disabled={isRegistering}
//                                 type="password"
//                                 autoComplete='off'
//                                 required
//                                 value={confirmPassword} onChange={(e) => { setconfirmPassword(e.target.value) }}
//                                 className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
//                             />
//                         </div>

//                         {errorMessage && (
//                             <span className='text-red-600 font-bold'>{errorMessage}</span>
//                         )}

//                         <button
//                             type="submit"
//                             disabled={isRegistering}
//                             className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isRegistering ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'}`}
//                         >
//                             {isRegistering ? 'Signing Up...' : 'Sign Up'}
//                         </button>
//                         <div className="text-sm text-center">
//                             Already have an account? {'   '}
//                             <Link to={'/login'} className="text-center text-sm hover:underline font-bold">Continue</Link>
//                         </div>
//                     </form>
//                 </div>
//             </main>
//         </>
//     )
// }

// export default Register