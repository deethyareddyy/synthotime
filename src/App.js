import Login from "./components/auth/login";
import Register from "./components/auth/register";


import GoogleCalendar from './components/GoogleCalendar';
import Questionnaire from './components/Questionnaire';

import Header from "./components/header";
import Home from "./components/home";

import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";

function App() {
  const routesArray = [
    {
      path: "*",
      element: <Login />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/calendar",
      element: <GoogleCalendar />,
    },
    {
      path: "/questionnaire",
      element: <Questionnaire />,
    },
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      <Header />
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;
