import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Historique } from "./pages/Historique";
import { Parametres } from "./pages/Parametres";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "historique", Component: Historique },
      { path: "parametres", Component: Parametres },
    ],
  },
  {
    path: "*",
    Component: () => <Navigate to="/login" replace />,
  },
]);
