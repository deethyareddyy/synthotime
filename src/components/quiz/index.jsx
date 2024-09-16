import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Quiz.css'; // Import the CSS for styling and animations

const questions = [
    { question: "What is the capital of France?", options: ["Paris", "London", "Rome", "Berlin"] },
    { question: "What is 2 + 2?", options: ["3", "4", "5", "6"] },
    // Add more questions as needed
];

const Quiz = () => {
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const handleAnswerChange = (e) => {
        setAnswers({ ...answers, [currentQuestion]: e.target.value });
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Handle form submission or final action
            alert("Quiz completed! Your answers have been recorded.");
            navigate('/home'); // Redirect to home or any other page after quiz completion
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    return (
        <div className="quiz-container">
            {/* Pixelation overlay before the quiz starts */}
            <div className="pixelation"></div>

            {/* Whiteboard with quiz content */}
            <div className="whiteboard">
                <div className="sticky-notes">
                    <div className="sticky-note yellow"></div>
                    <div className="sticky-note green"></div>
                    <div className="sticky-note pink"></div>
                    <div className="sticky-note blue"></div>
                </div>
                <div className="whiteboard-content">
                    <h2 className="text-gray-800 text-xl font-semibold text-center mb-4">Quiz</h2>
                    <div className="p-4">
                        <p className="text-lg font-semibold mb-2">{questions[currentQuestion].question}</p>
                        <div className="space-y-2">
                            {questions[currentQuestion].options.map((option, index) => (
                                <div key={index} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`option-${index}`}
                                        name="quiz-option"
                                        value={option}
                                        checked={answers[currentQuestion] === option}
                                        onChange={handleAnswerChange}
                                        className="mr-2"
                                    />
                                    <label htmlFor={`option-${index}`} className="text-gray-700">{option}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextQuestion}
                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg"
                        >
                            {currentQuestion === questions.length - 1 ? "Finish" : "Next"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Desk with study materials */}
            <div className="desk">
                <div className="item cup"></div>
                <div className="item computer"></div>
                <div className="item lamp"></div>
                <div className="item notebook"></div>
            </div>

            {/* Shapes animation */}
            <div className="shapes-animation">
                <div className="shape circle"></div>
                <div className="shape square"></div>
                <div className="shape triangle"></div>
            </div>

            {/* Paper airplanes animation with dotted lines */}
            <div className="paper-airplanes">
                <div className="paper-airplane">
                    <div className="dotted-line"></div>
                </div>
                <div className="paper-airplane">
                    <div className="dotted-line"></div>
                </div>
            </div>
        </div>
    );
};