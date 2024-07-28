import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "@/pages/404";
import Layout from "@/components/Layout";
import VideoToX from "@/pages/VideoToX";
import MORE from "@/pages/More";
import { ROUTES } from "./typings";

// const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
const router: ReturnType<typeof createHashRouter> = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,

    children: [
      {
        index: true, // This marks the default child route
        element: <Navigate to={ROUTES.VIDEO_TO_X} replace />,
      },
      {
        path: ROUTES.VIDEO_TO_X,
        element: <VideoToX />,
      },
      {
        path: ROUTES.MORE,
        element: <MORE />,
      },
    ],
  },
]);
export { RouterProvider, router };
