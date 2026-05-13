import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { MachineProvider } from "./context/MachineContext";
import { EventsProvider } from "./context/EventsContext";

export default function App() {
  return (
    <AuthProvider>
      <MachineProvider>
        <EventsProvider>
          <RouterProvider router={router} />
        </EventsProvider>
      </MachineProvider>
    </AuthProvider>
  );
}
