import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { AppRoutes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
