// React
import { Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// import "./App.css";

import { AppUI } from "./components/ui/ui";
import { HomeView } from "./components/pages/home";
import { STTTester } from "./components/pages/sttTester";

function App() {

  // Assume done
  const initDone = true;

  useEffect(() => {
    // Stuff will come here
  }, []);

  return !initDone ? (
    <></>
  ) : (
    <Suspense>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<AppUI />}>
            <Route index element={<HomeView />} />

            <Route path="test" element={<STTTester lc="en" />} />

            {/* Error */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  ); // return
} // App

export default App;
