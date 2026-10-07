import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" toastOption={{ duration: 3000 }} />
    </>
  );
};

export default App;
